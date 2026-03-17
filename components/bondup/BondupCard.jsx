/**
 * BondupCard.jsx
 *
 * A card displayed in the Bondup feed showing:
 *  - Activity emoji + title
 *  - Creator info (avatar + name)
 *  - Date/time, location, city
 *  - Visibility badge (public / circle)
 *  - Participants count + avatars
 *  - Join / Joined / Full button
 */

import { MapPin, Users } from 'lucide-react-native';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../constant/colors';

const BRAND = colors.primary;

// ─── Activity emoji map ───────────────────────────────────────────────────────
const ACTIVITY_EMOJI = {
  coffee: '☕',
  food:   '🍔',
  drinks: '🍹',
  gym:    '💪',
  walk:   '🚶',
  movie:  '🎬',
  other:  '✨',
};

const ACTIVITY_LABEL = {
  coffee: 'Coffee',
  food:   'Food',
  drinks: 'Drinks',
  gym:    'Gym',
  walk:   'Walk',
  movie:  'Movie',
  other:  'Other',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const avatarUrl = (user) =>
  user?.profilePhoto || user?.images?.[0]?.url || user?.images?.[0] || null;

const formatDateTime = (dateTime) => {
  if (!dateTime) return '';
  const d = new Date(dateTime);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 86400000);
  const yesterday = new Date(today.getTime() - 86400000);
  const dDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const timeStr = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  if (dDay.getTime() === today.getTime()) return `Today, ${timeStr}`;
  if (dDay.getTime() === tomorrow.getTime()) return `Tomorrow, ${timeStr}`;
  if (dDay.getTime() === yesterday.getTime()) return `Yesterday, ${timeStr}`;
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) + `, ${timeStr}`;
};

const getFirstName = (user) => {
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ');
  return name.split(' ')[0] || 'User';
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function BondupCard({
  bondup,
  currentUserId,
  onJoin,
  onLeave,
  onDelete,
  onPress,
}) {
  if (!bondup) return null;

  const creator = bondup.createdBy;
  const creatorAvatar = avatarUrl(creator);
  const participantCount = bondup.participants?.length ?? 0;
  const isFull =
    bondup.maxParticipants != null && participantCount >= bondup.maxParticipants;

  const isOwner = bondup.isOwner ||
    String(creator?._id || creator) === String(currentUserId);
  const hasJoined = bondup.hasJoined;

  const activityEmoji = ACTIVITY_EMOJI[bondup.activityType] || '✨';
  const activityLabel = ACTIVITY_LABEL[bondup.activityType] || bondup.activityType;

  // Show up to 3 participant avatars
  const participantAvatars = (bondup.participants || [])
    .slice(0, 3)
    .map((pt) => avatarUrl(pt.user));

  return (
    <TouchableOpacity
      style={s.card}
      onPress={() => onPress?.(bondup)}
      activeOpacity={0.85}
    >
      {/* Header row */}
      <View style={s.headerRow}>
        {/* Creator avatar */}
        <TouchableOpacity onPress={() => onPress?.(bondup)} activeOpacity={0.7}>
          {creatorAvatar ? (
            <Image source={{ uri: creatorAvatar }} style={s.creatorAvatar} />
          ) : (
            <View style={[s.creatorAvatar, s.creatorAvatarFallback]}>
              <Text style={s.creatorAvatarInitial}>
                {(creator?.firstName || 'U')[0].toUpperCase()}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={s.creatorInfo}>
          <Text style={s.creatorName}>{getFirstName(creator)}</Text>
          <Text style={s.timeText}>{formatDateTime(bondup.dateTime)}</Text>
        </View>

        {/* Visibility badge */}
        <View style={[s.visibilityBadge, bondup.visibility === 'circle' && s.visibilityCircle]}>
          <Text style={[s.visibilityText, bondup.visibility === 'circle' && s.visibilityCircleText]}>
            {bondup.visibility === 'circle' ? '🔒 Circle' : '🌍 Public'}
          </Text>
        </View>
      </View>

      {/* Activity + Title */}
      <View style={s.titleRow}>
        <View style={s.activityBadge}>
          <Text style={s.activityEmoji}>{activityEmoji}</Text>
          <Text style={s.activityLabel}>{activityLabel}</Text>
        </View>
        <Text style={s.title} numberOfLines={2}>{bondup.title}</Text>
      </View>

      {/* Description (if any) */}
      {!!bondup.description && (
        <Text style={s.description} numberOfLines={2}>{bondup.description}</Text>
      )}

      {/* Location + city */}
      {(!!bondup.location || !!bondup.city) && (
        <View style={s.locationRow}>
          <MapPin size={13} color="#999" />
          <Text style={s.locationText} numberOfLines={1}>
            {[bondup.location, bondup.city].filter(Boolean).join(' • ')}
          </Text>
        </View>
      )}

      {/* Footer row: participants + action button */}
      <View style={s.footerRow}>
        {/* Participant avatars */}
        <View style={s.participantsRow}>
          {participantAvatars.map((uri, i) =>
            uri ? (
              <Image
                key={i}
                source={{ uri }}
                style={[s.participantAvatar, { marginLeft: i > 0 ? -8 : 0 }]}
              />
            ) : (
              <View
                key={i}
                style={[s.participantAvatar, s.participantAvatarFallback, { marginLeft: i > 0 ? -8 : 0 }]}
              />
            )
          )}
          <View style={s.participantCountRow}>
            <Users size={13} color="#888" />
            <Text style={s.participantCountText}>
              {participantCount}
              {bondup.maxParticipants ? `/${bondup.maxParticipants}` : ''} joined
            </Text>
          </View>
        </View>

        {/* Action button */}
        {isOwner ? (
          <TouchableOpacity
            style={s.ownerBtn}
            onPress={() => onDelete?.(bondup._id)}
            activeOpacity={0.7}
          >
            <Text style={s.ownerBtnText}>Remove</Text>
          </TouchableOpacity>
        ) : hasJoined ? (
          <TouchableOpacity
            style={[s.actionBtn, s.joinedBtn]}
            onPress={() => onLeave?.(bondup._id)}
            activeOpacity={0.8}
          >
            <Text style={s.joinedBtnText}>You're in 🎉</Text>
          </TouchableOpacity>
        ) : isFull ? (
          <View style={[s.actionBtn, s.fullBtn]}>
            <Text style={s.fullBtnText}>Full</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[s.actionBtn, s.joinBtn]}
            onPress={() => onJoin?.(bondup._id)}
            activeOpacity={0.8}
          >
            <Text style={s.joinBtnText}>Join</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  creatorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: `${BRAND}30`,
  },
  creatorAvatarFallback: {
    backgroundColor: BRAND,
    justifyContent: 'center',
    alignItems: 'center',
  },
  creatorAvatarInitial: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'PlusJakartaSansBold',
  },
  creatorInfo: {
    flex: 1,
    marginLeft: 10,
  },
  creatorName: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSansBold',
    color: '#111',
  },
  timeText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans',
    color: '#888',
    marginTop: 1,
  },
  visibilityBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  visibilityCircle: {
    backgroundColor: '#F5F3FF',
  },
  visibilityText: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSansMedium',
    color: '#16A34A',
  },
  visibilityCircleText: {
    color: BRAND,
  },

  // Title + activity
  titleRow: {
    marginBottom: 6,
  },
  activityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 6,
  },
  activityEmoji: {
    fontSize: 13,
  },
  activityLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSansMedium',
    color: BRAND,
  },
  title: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSansBold',
    color: '#111',
    lineHeight: 22,
  },

  // Description
  description: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans',
    color: '#666',
    lineHeight: 18,
    marginBottom: 8,
  },

  // Location
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  locationText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans',
    color: '#999',
    flex: 1,
  },

  // Footer
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  participantsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  participantAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#fff',
  },
  participantAvatarFallback: {
    backgroundColor: '#E5E7EB',
  },
  participantCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginLeft: 4,
  },
  participantCountText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans',
    color: '#888',
  },

  // Buttons
  actionBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 14,
    minWidth: 72,
    alignItems: 'center',
  },
  joinBtn: {
    backgroundColor: BRAND,
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  joinBtnText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'PlusJakartaSansBold',
  },
  joinedBtn: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  joinedBtnText: {
    color: '#16A34A',
    fontSize: 13,
    fontFamily: 'PlusJakartaSansBold',
  },
  fullBtn: {
    backgroundColor: '#F3F4F6',
  },
  fullBtnText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontFamily: 'PlusJakartaSansMedium',
  },
  ownerBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  ownerBtnText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSansMedium',
    color: '#EF4444',
  },
});
