import { useRouter } from 'expo-router';
import { UserCheck, UserX, Users } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { colors } from '../../../constant/colors';
import bondupService from '../../../services/bondupService';
import BaseModal from '../../modals/BaseModal';

const BRAND = colors.primary;

const avatarUrl = (user) =>
  user?.profilePhoto || user?.images?.[0]?.url || user?.images?.[0] || null;

const FriendRequestsModal = ({ visible, onClose }) => {
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadRequests();
    }
  }, [visible]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      // We need to get friend requests where the current user is the receiver
      // This might require a new API endpoint or modifying existing one
      // For now, let's assume we have a way to get pending requests
      const res = await bondupService.getFriendRequests();
      if (res.success) {
        setRequests(res.data || []);
      }
    } catch (error) {
      console.error('Failed to load friend requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId) => {
    try {
      await bondupService.acceptFriendRequest(requestId);
      // Remove from requests list
      setRequests(prev => prev.filter(r => r._id !== requestId));
    } catch (error) {
      console.error('Failed to accept request:', error);
    }
  };

  const handleDecline = async (requestId) => {
    try {
      await bondupService.declineFriendRequest(requestId);
      // Remove from requests list
      setRequests(prev => prev.filter(r => r._id !== requestId));
    } catch (error) {
      console.error('Failed to decline request:', error);
    }
  };

  const handleProfilePress = (userId) => {
    onClose();
    router.push(`/bondup-profile/${userId}`);
  };

  return (
    <BaseModal visible={visible} onClose={onClose} fullScreen>
      <View style={s.header}>
        <Text style={s.headerTitle}>Friend Requests</Text>
        <TouchableOpacity onPress={onClose} style={s.closeBtn}>
          <UserX size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={s.content}>
        {loading ? (
          <View style={s.loadingContainer}>
            <ActivityIndicator size="large" color={BRAND} />
            <Text style={s.loadingText}>Loading requests...</Text>
          </View>
        ) : requests.length === 0 ? (
          <View style={s.emptyContainer}>
            <Users size={48} color="#ccc" />
            <Text style={s.emptyText}>No friend requests</Text>
            <Text style={s.emptySubtext}>When someone sends you a friend request, it will appear here</Text>
          </View>
        ) : (
          requests.map((request) => {
            const sender = request.sender;
            const senderAv = avatarUrl(sender);

            return (
              <View key={request._id} style={s.requestItem}>
                <TouchableOpacity
                  style={s.userInfo}
                  onPress={() => handleProfilePress(sender._id)}
                  activeOpacity={0.7}
                >
                  {senderAv ? (
                    <Image source={{ uri: senderAv }} style={s.avatar} />
                  ) : (
                    <View style={[s.avatar, s.avatarFallback]}>
                      <Text style={s.avatarInitial}>
                        {(sender?.firstName || 'U')[0].toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={s.userDetails}>
                    <Text style={s.userName}>
                      {[sender?.firstName, sender?.lastName].filter(Boolean).join(' ') || sender?.userName || 'User'}
                    </Text>
                    <Text style={s.requestTime}>
                      {new Date(request.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </TouchableOpacity>

                <View style={s.actionButtons}>
                  <TouchableOpacity
                    style={[s.actionBtn, s.acceptBtn]}
                    onPress={() => handleAccept(request._id)}
                    activeOpacity={0.8}
                  >
                    <UserCheck size={16} color="#fff" />
                    <Text style={s.actionBtnText}>Accept</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[s.actionBtn, s.declineBtn]}
                    onPress={() => handleDecline(request._id)}
                    activeOpacity={0.8}
                  >
                    <UserX size={16} color="#666" />
                    <Text style={[s.actionBtnText, s.declineBtnText]}>Decline</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </View>
    </BaseModal>
  );
};

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSansBold',
    color: '#333',
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: 'PlusJakartaSans',
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontFamily: 'PlusJakartaSansBold',
    color: '#666',
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: 'PlusJakartaSans',
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  requestItem: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  avatarFallback: {
    backgroundColor: BRAND,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSansBold',
    color: '#fff',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSansBold',
    color: '#333',
    marginBottom: 2,
  },
  requestTime: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans',
    color: '#999',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  acceptBtn: {
    backgroundColor: BRAND,
  },
  declineBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  actionBtnText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSansBold',
    color: '#fff',
  },
  declineBtnText: {
    color: '#666',
  },
});

export default FriendRequestsModal;