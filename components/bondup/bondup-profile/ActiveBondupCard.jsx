import { MapPin, Users } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from "react-redux";
import { useBondupInteractions } from '../../../hooks/useBondupInteractions';
import bondupService from '../../../services/bondupService';
import BondupDetailModal from '../../bondup/BondupDetailModal';

const ActiveBondupCard = ({ bondup, currentUserId, onBondupUpdate }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [detailedBondup, setDetailedBondup] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const { user: currentUser } = useSelector((s) => s.auth);

  const {
    handleJoin,
    handleLeave,
    handleDelete,
    handleStartChat,
    handleStartDirectChat,
  } = useBondupInteractions();

  const emoji = {
    coffee: '☕', food: '🍔', drinks: '🍹', gym: '💪',
    walk: '🚶', movie: '🎬', other: '✨',
  }[bondup.activityType] || '✨';

  const dateLabel = bondup.dateTime
    ? new Date(bondup.dateTime).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const handlePress = async () => {
    setModalVisible(true);
    setLoadingDetail(true);
    try {
      const res = await bondupService.getBondup(bondup._id);
      if (res.success) {
        setDetailedBondup(res.data);
      }
    } catch (error) {
      console.error('Failed to load bondup details:', error);
      // Fallback to basic bondup data if detailed fetch fails
      setDetailedBondup(bondup);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setDetailedBondup(null);
  };

  const handleJoinPress = async () => {
    await handleJoin(bondup._id, (updatedBondup) => {
      setDetailedBondup(updatedBondup);
      onBondupUpdate?.(updatedBondup);
    });
  };

  const handleLeavePress = async () => {
    await handleLeave(bondup._id, (updatedBondup) => {
      setDetailedBondup(updatedBondup);
      onBondupUpdate?.(updatedBondup);
    });
  };

  const handleDeletePress = async () => {
    await handleDelete(bondup._id, () => {
      onBondupUpdate?.(null, bondup._id); // Pass null data and bondupId to indicate deletion
      setModalVisible(false);
      setDetailedBondup(null);
    });
  };

  const handleStartChatPress = async () => {
    await handleStartChat(detailedBondup || bondup);
  };

  const handleStartDirectChatPress = async (userId) => {
    await handleStartDirectChat(userId);
  };

  return (
    <>
      <TouchableOpacity style={s.bondupCard} onPress={handlePress} activeOpacity={0.7}>
        <Text style={s.bondupEmoji}>{emoji}</Text>
        <View style={s.bondupCardContent}>
          <Text style={s.bondupTitle} numberOfLines={1}>{bondup.title}</Text>
          {!!bondup.description && (
            <Text style={s.bondupDescription} numberOfLines={2}>
              {bondup.description}
            </Text>
          )}
          <View style={s.bondupMeta}>
            {!!bondup.city && (
              <View style={s.bondupMetaRow}>
                <MapPin size={11} color="#888" />
                <Text style={s.bondupMetaText}>{bondup.city}</Text>
              </View>
            )}
            {!!dateLabel && <Text style={s.bondupMetaText}>{dateLabel}</Text>}
          </View>
        </View>
        <View style={s.bondupParticipants}>
          <Users size={13} color="#888" />
          <Text style={s.bondupParticipantCount}>{bondup.participantCount ?? 0}</Text>
        </View>
      </TouchableOpacity>

      <BondupDetailModal
        visible={modalVisible}
        bondup={detailedBondup || bondup}
        currentUserId={currentUser?._id}
        onClose={handleModalClose}
        onJoin={handleJoinPress}
        onLeave={handleLeavePress}
        onDelete={handleDeletePress}
        onStartChat={handleStartChatPress}
        onStartDirectChat={handleStartDirectChatPress}
        joinLoading={joinLoading || loadingDetail}
      />
    </>
  );
};

const s = StyleSheet.create({
  bondupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    backgroundColor: '#007AFF10',
    borderRadius: 12,
  },
  bondupEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  bondupCardContent: {
    flex: 1,
  },
  bondupTitle: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSansBold',
    color: '#111',
    marginBottom: 3,
  },
  bondupDescription: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans',
    color: '#666',
    marginBottom: 6,
    lineHeight: 18,
  },
  bondupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bondupMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  bondupMetaText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans',
    color: '#888',
  },
  bondupParticipants: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  bondupParticipantCount: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSansBold',
    color: '#666',
  },
});

export default ActiveBondupCard;