/**
 * BondupDetailModal.jsx
 *
 * Full details for a Bondup:
 *  - Title, activity, date/time, location, description
 *  - Creator info
 *  - Participants list
 *  - Join / Leave button
 *  - Chat button (for joined users)
 *  - Delete button (for creator)
 */

import {
  CalendarDays,
  MapPin,
  MessageCircle,
  Trash2,
  Users,
  X,
} from 'lucide-react-native';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import BaseModal from '../modals/BaseModal';
import { colors } from '../../constant/colors';

const BRAND = colors.primary;

const ACTIVITY_EMOJI = {
  coffee: '☕',
  food:   '🍔',
  drinks: '🍹',
  gym:    '💪',
  walk:   '🚶',
  movie:  '🎬',
  other:  '✨',
};

const avatarUrl = (user) =>
  user?.profilePhoto || user?.images?.[0]?.url || user?.images?.[0] || null;

const formatDateTime = (dateTime) => {
  if (!dateTime) return '';
  const d = new Date(dateTime);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 86400000);
  const dDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const timeStr = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  if (dDay.getTime() === today.getTime()) return `Today at ${timeStr}`;
  if (dDay.getTime() === tomorrow.getTime()) return `Tomorrow at ${timeStr}`;
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) + ` at ${timeStr}`;
};

const getFullName = (user) =>
  [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'User';

export default function BondupDetailModal({
  visible,
  bondup,
  currentUserId,
  onClose,
  onJoin,
  onLeave,
  onDelete,
  onStartChat,
  joinLoading,
}) {
  if (!bondup) return null;

  const creator = bondup.createdBy;
  const participantCount = bondup.participants?.length ?? 0;
  const isFull =
    bondup.maxParticipants != null && participantCount >= bondup.maxParticipants;
  const isOwner = bondup.isOwner ||
    String(creator?._id || creator) === String(currentUserId);
  const hasJoined = bondup.hasJoined;
  const canChat = isOwner || hasJoined;
  const activityEmoji = ACTIVITY_EMOJI[bondup.activityType] || '✨';

  return (
    <BaseModal visible={visible} onClose={onClose} fullScreen>
      {/* Header bar */}
      <View style={s.header}>
        <TouchableOpacity onPress={onClose} style={s.closeBtn} hitSlop={10}>
          <X size={22} color="#333" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Bondup Details</Text>
        {isOwner ? (
          <TouchableOpacity
            style={s.deleteBtn}
            onPress={() => onDelete?.(bondup._id)}
            hitSlop={10}
          >
            <Trash2 size={20} color="#EF4444" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 34 }} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Activity + Title */}
        <View style={s.titleSection}>
          <View style={s.activityBadge}>
            <Text style={s.activityEmoji}>{activityEmoji}</Text>
            <Text style={s.activityLabel}>{bondup.activityType}</Text>
          </View>
          <Text style={s.title}>{bondup.title}</Text>
          {!!bondup.description && (
            <Text style={s.description}>{bondup.description}</Text>
          )}
        </View>

        {/* Meta info cards */}
        <View style={s.metaRow}>
          <View style={s.metaCard}>
            <CalendarDays size={18} color={BRAND} />
            <Text style={s.metaText}>{formatDateTime(bondup.dateTime)}</Text>
          </View>
          {(!!bondup.location || !!bondup.city) && (
            <View style={s.metaCard}>
              <MapPin size={18} color={BRAND} />
              <Text style={s.metaText} numberOfLines={1}>
                {[bondup.location, bondup.city].filter(Boolean).join(' • ')}
              </Text>
            </View>
          )}
          <View style={s.metaCard}>
            <Users size={18} color={BRAND} />
            <Text style={s.metaText}>
              {participantCount}
              {bondup.maxParticipants ? `/${bondup.maxParticipants}` : ''} joined
            </Text>
          </View>
        </View>

        {/* Visibility */}
        <View style={s.visibilityRow}>
          <Text style={s.visibilityText}>
            {bondup.visibility === 'circle' ? '🔒 Circle only' : '🌍 Public'}
          </Text>
        </View>

        {/* Creator */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Created by</Text>
          <View style={s.personRow}>
            {avatarUrl(creator) ? (
              <Image source={{ uri: avatarUrl(creator) }} style={s.avatar} />
            ) : (
              <View style={[s.avatar, s.avatarFallback]}>
                <Text style={s.avatarInitial}>
                  {(creator?.firstName || 'U')[0].toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={s.personName}>{getFullName(creator)}</Text>
            {isOwner && (
              <View style={s.youBadge}>
                <Text style={s.youBadgeText}>You</Text>
              </View>
            )}
          </View>
        </View>

        {/* Participants */}
        {participantCount > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>
              {participantCount} {participantCount === 1 ? 'Person' : 'People'} Joined
            </Text>
            {(bondup.participants || []).map((pt, i) => {
              const user = pt.user;
              const isMe = String(user?._id || user) === String(currentUserId);
              return (
                <View key={i} style={s.personRow}>
                  {avatarUrl(user) ? (
                    <Image source={{ uri: avatarUrl(user) }} style={s.avatar} />
                  ) : (
                    <View style={[s.avatar, s.avatarFallback]}>
                      <Text style={s.avatarInitial}>
                        {(user?.firstName || 'U')[0].toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <Text style={s.personName}>{getFullName(user)}</Text>
                  {isMe && (
                    <View style={s.youBadge}>
                      <Text style={s.youBadgeText}>You</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Action buttons */}
      <View style={s.footer}>
        {/* Chat button (only if joined or is owner) */}
        {canChat && (
          <TouchableOpacity
            style={s.chatBtn}
            onPress={() => onStartChat?.(bondup)}
            activeOpacity={0.8}
          >
            <MessageCircle size={20} color={BRAND} />
            <Text style={s.chatBtnText}>Chat</Text>
          </TouchableOpacity>
        )}

        {/* Join / Leave / Full */}
        {!isOwner && (
          hasJoined ? (
            <TouchableOpacity
              style={[s.actionBtn, s.leaveBtn]}
              onPress={() => {
                Alert.alert('Leave Bondup', 'Are you sure you want to leave?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Leave', style: 'destructive', onPress: () => onLeave?.(bondup._id) },
                ]);
              }}
              activeOpacity={0.8}
            >
              <Text style={s.leaveBtnText}>Leave Bondup</Text>
            </TouchableOpacity>
          ) : isFull ? (
            <View style={[s.actionBtn, s.fullBtn]}>
              <Text style={s.fullBtnText}>Bondup is Full</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[s.actionBtn, s.joinBtn, joinLoading && { opacity: 0.7 }]}
              onPress={() => onJoin?.(bondup._id)}
              disabled={joinLoading}
              activeOpacity={0.8}
            >
              {joinLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={s.joinBtnText}>Join Bondup 🎉</Text>
              )}
            </TouchableOpacity>
          )
        )}
      </View>
    </BaseModal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: 'PlusJakartaSansBold',
    color: '#111',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Title section
  titleSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  activityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryLight,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 10,
  },
  activityEmoji: { fontSize: 16 },
  activityLabel: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSansMedium',
    color: BRAND,
    textTransform: 'capitalize',
  },
  title: {
    fontSize: 22,
    fontFamily: 'PlusJakartaSansBold',
    color: '#111',
    marginBottom: 8,
    lineHeight: 28,
  },
  description: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans',
    color: '#555',
    lineHeight: 20,
  },

  // Meta
  metaRow: {
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 12,
  },
  metaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  metaText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSansMedium',
    color: '#333',
    flex: 1,
  },

  // Visibility
  visibilityRow: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  visibilityText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSansMedium',
    color: '#888',
  },

  // Sections
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSansBold',
    color: '#111',
    marginBottom: 12,
  },

  // Person rows
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  avatarFallback: {
    backgroundColor: BRAND,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'PlusJakartaSansBold',
  },
  personName: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSansMedium',
    color: '#111',
    flex: 1,
  },
  youBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  youBadgeText: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSansBold',
    color: BRAND,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#fff',
  },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: BRAND,
  },
  chatBtnText: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSansBold',
    color: BRAND,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  joinBtn: {
    backgroundColor: BRAND,
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  joinBtnText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSansBold',
    color: '#fff',
  },
  leaveBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  leaveBtnText: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSansBold',
    color: '#EF4444',
  },
  fullBtn: {
    backgroundColor: '#F3F4F6',
  },
  fullBtnText: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSansMedium',
    color: '#9CA3AF',
  },
});
