/**
 * BondupCard.jsx  —  Artistic redesign
 */

import { useRouter } from 'expo-router';
import { Clock, MapPin, Users } from 'lucide-react-native';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../constant/colors';

const BRAND = colors.primary;

// ─── Activity maps ────────────────────────────────────────────────────────────
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
  food:   'Dining',
  drinks: 'Drinks',
  gym:    'Gym',
  walk:   'Outdoor',
  movie:  'Cinema',
  other:  'Other',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const avatarUrl = (user) =>
  user?.profilePhoto || user?.images?.[0]?.url || user?.images?.[0] || null;

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const formatDateTime = (dateTime) => {
  if (!dateTime) return '';
  const d = new Date(dateTime);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 86400000);
  const dDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const timeStr = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  if (dDay.getTime() === today.getTime()) return `Today, ${timeStr}`;
  if (dDay.getTime() === tomorrow.getTime()) return `Tomorrow, ${timeStr}`;
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) + `, ${timeStr}`;
};

const isLiveNow = (dateTime) => {
  if (!dateTime) return false;
  return Math.abs(new Date(dateTime) - new Date()) <= 2 * 60 * 60 * 1000;
};

const getFullName = (user) =>
  [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'User';

// ─── Component ────────────────────────────────────────────────────────────────
export default function BondupCard({
  bondup,
  currentUserId,
  onJoin,
  onLeave,
  onDelete,
  onPress,
}) {
  const router = useRouter();
  if (!bondup) return null;

  const creator = bondup.createdBy;
  const creatorAv = avatarUrl(creator);
  const participantCount = bondup.participants?.length ?? 0;
  const isFull = bondup.maxParticipants != null && participantCount >= bondup.maxParticipants;
  const isOwner = bondup.isOwner || String(creator?._id || creator) === String(currentUserId);
  const hasJoined = bondup.hasJoined;
  const activityEmoji = ACTIVITY_EMOJI[bondup.activityType] || '✨';
  const activityLabel = ACTIVITY_LABEL[bondup.activityType] || bondup.activityType;
  const live = isLiveNow(bondup.dateTime);
  const creatorId = creator?._id || creator;

  const spotsText = bondup.maxParticipants
    ? `${participantCount}/${bondup.maxParticipants} spots`
    : `${participantCount} joined`;

  return (
    <TouchableOpacity
      style={s.card}
      onPress={() => onPress?.(bondup)}
      activeOpacity={0.88}
    >
      {/* ── Top row: avatar | name + time | category badge ── */}
      <View style={s.topRow}>
        <TouchableOpacity
          onPress={() => creatorId && router.push(`/bondup-profile/${creatorId}`)}
          activeOpacity={0.8}
        >
          {creatorAv ? (
            <Image source={{ uri: creatorAv }} style={s.creatorAvatar} />
          ) : (
            <View style={[s.creatorAvatar, s.creatorAvatarFallback]}>
              <Text style={s.creatorInitial}>
                {(creator?.firstName || 'U')[0].toUpperCase()}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={s.creatorMeta}>
          <Text style={s.creatorName}>{getFullName(creator)}</Text>
          <Text style={s.timeAgoText}>
            {bondup.createdAt ? timeAgo(bondup.createdAt) : formatDateTime(bondup.dateTime)}
          </Text>
        </View>

        <View style={s.categoryBadge}>
          <Text style={s.categoryText}>
            {activityLabel.toUpperCase()} {activityEmoji}
          </Text>
        </View>
      </View>

      {/* ── Location row ── */}
      {(!!bondup.location || !!bondup.city) && (
        <View style={s.locationRow}>
          <MapPin size={12} color="#999" />
          <Text style={s.locationText} numberOfLines={1}>
            {[bondup.location, bondup.city].filter(Boolean).join(', ')}
          </Text>
        </View>
      )}

      {/* ── LIVE NOW badge ── */}
      {live && (
        <View style={s.liveBadge}>
          <View style={s.liveDot} />
          <Text style={s.liveText}>LIVE NOW</Text>
        </View>
      )}

      {/* ── Title + description ── */}
      <Text style={s.title} numberOfLines={2}>{bondup.title}</Text>
      {!!bondup.description && (
        <Text style={s.description} numberOfLines={2}>{bondup.description}</Text>
      )}

      {/* ── Info chips: time + spots ── */}
      <View style={s.infoRow}>
        <View style={s.infoChip}>
          <Clock size={13} color={BRAND} />
          <Text style={s.infoChipText}>{formatDateTime(bondup.dateTime)}</Text>
        </View>
        <View style={[s.infoChip, s.infoChipRight]}>
          <Users size={13} color={BRAND} />
          <Text style={s.infoChipText}>{spotsText}</Text>
        </View>
      </View>

      {/* ── Action button (full-width) ── */}
      {isOwner ? (
        <TouchableOpacity
          style={s.manageBtn}
          onPress={() => onPress?.(bondup)}
          activeOpacity={0.8}
        >
          <Text style={s.manageBtnText}>Manage</Text>
        </TouchableOpacity>
      ) : hasJoined ? (
        <TouchableOpacity
          style={s.joinedBtn}
          onPress={() => onLeave?.(bondup._id)}
          activeOpacity={0.8}
        >
          <Text style={s.joinedBtnText}>You're in 🎉</Text>
        </TouchableOpacity>
      ) : isFull ? (
        <View style={s.fullBtn}>
          <Text style={s.fullBtnText}>Full</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={s.joinBtn}
          onPress={() => onJoin?.(bondup._id)}
          activeOpacity={0.8}
        >
          <Text style={s.joinBtnText}>🔥 Join the Bond</Text>
        </TouchableOpacity>
      )}
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
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
  },

  // Top row
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
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
  creatorInitial: {
    color: '#fff',
    fontSize: 17,
    fontFamily: 'PlusJakartaSansBold',
  },
  creatorMeta: {
    flex: 1,
    marginLeft: 10,
  },
  creatorName: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSansBold',
    color: '#111',
  },
  timeAgoText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans',
    color: '#999',
    marginTop: 1,
  },
  categoryBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginLeft: 6,
  },
  categoryText: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSansBold',
    color: BRAND,
    letterSpacing: 0.5,
  },

  // Location
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans',
    color: '#999',
    flex: 1,
  },

  // Live badge
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFF7ED',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#F97316',
  },
  liveText: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSansBold',
    color: '#F97316',
    letterSpacing: 0.5,
  },

  // Title + description
  title: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSansBold',
    color: '#111',
    lineHeight: 24,
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans',
    color: '#777',
    lineHeight: 18,
    marginBottom: 10,
  },

  // Info chips
  infoRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
    marginTop: 2,
  },
  infoChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
  },
  infoChipRight: {},
  infoChipText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSansMedium',
    color: BRAND,
    flex: 1,
  },

  // Buttons (full-width)
  joinBtn: {
    backgroundColor: BRAND,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  joinBtnText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'PlusJakartaSansBold',
  },
  joinedBtn: {
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    backgroundColor: '#F0FDF4',
  },
  joinedBtnText: {
    color: '#16A34A',
    fontSize: 15,
    fontFamily: 'PlusJakartaSansBold',
  },
  fullBtn: {
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  fullBtnText: {
    color: '#9CA3AF',
    fontSize: 15,
    fontFamily: 'PlusJakartaSansMedium',
  },
  manageBtn: {
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: BRAND,
  },
  manageBtnText: {
    color: BRAND,
    fontSize: 15,
    fontFamily: 'PlusJakartaSansBold',
  },
});
