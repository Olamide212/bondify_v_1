/**
 * BondupCard.jsx  —  Artistic redesign
 */

import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Clock, MapPin, Users } from 'lucide-react-native';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../constant/colors';

const BRAND = colors.primary;

// ─── Activity maps ────────────────────────────────────────────────────────────
const ACTIVITY_EMOJI = {
  coffee: '☕', food: '🍔', drinks: '🍹', brunch: '🥐', dinner: '🍽️', lunch: '🥗', snacks: '🍿', dessert: '🍰',
  gym: '💪', yoga: '🧘', running: '🏃', hiking: '🥾', cycling: '🚴', swimming: '🏊', tennis: '🎾', basketball: '🏀', football: '⚽', volleyball: '🏐',
  walk: '🚶', park: '🌳', beach: '🏖️', picnic: '🧺', camping: '⛺', fishing: '🎣',
  movie: '🎬', theater: '🎭', concert: '🎵', museum: '🏛️', art: '🎨', comedy: '😂',
  board_games: '🎲', video_games: '🎮', karaoke: '🎤', dancing: '💃', party: '🎉', networking: '🤝',
  workshop: '🔨', class: '📚', photography: '📷', painting: '🖌️', music: '🎼',
  other: '✨',
};

const ACTIVITY_LABEL = {
  coffee: 'Coffee', food: 'Dining', drinks: 'Drinks', brunch: 'Brunch', dinner: 'Dinner', lunch: 'Lunch', snacks: 'Snacks', dessert: 'Dessert',
  gym: 'Gym', yoga: 'Yoga', running: 'Running', hiking: 'Hiking', cycling: 'Cycling', swimming: 'Swimming', tennis: 'Tennis', basketball: 'Basketball', football: 'Football', volleyball: 'Volleyball',
  walk: 'Walking', park: 'Park', beach: 'Beach', picnic: 'Picnic', camping: 'Camping', fishing: 'Fishing',
  movie: 'Cinema', theater: 'Theater', concert: 'Concert', museum: 'Museum', art: 'Art Gallery', comedy: 'Comedy Show',
  board_games: 'Board Games', video_games: 'Video Games', karaoke: 'Karaoke', dancing: 'Dancing', party: 'Party', networking: 'Networking',
  workshop: 'Workshop', class: 'Class', photography: 'Photography', painting: 'Painting', music: 'Music',
  other: 'Other',
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

const getDisplayName = (user) =>
  user?.userName || user?.firstName || 'User';

// ─── Component ────────────────────────────────────────────────────────────────
export default function BondupCard({
  bondup,
  currentUserId,
  onJoin,
  onLeave,
  onDelete,
  onPress,
  onJoinChat,
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
      {/* Background layers */}
      <View style={s.cardBackground}>
        <View style={s.cardGradient} />
        <View style={s.cardPattern} />

        {/* ── Top row: avatar | name + time | category badge ── */}
        <View style={s.topRow}>
          <TouchableOpacity
            onPress={() => creatorId && router.push(`/bondup-profile/${creatorId}`)}
            activeOpacity={0.8}
          >
            {creatorAv ? (
              <Image 
                source={{ uri: creatorAv }} 
                style={s.creatorAvatar} 
                cachePolicy="memory-disk"
                placeholder={{ color: '#E5E7EB' }}
                transition={200}
              />
            ) : (
              <View style={[s.creatorAvatar, s.creatorAvatarFallback]}>
                <Text style={s.creatorInitial}>
                  {(creator?.firstName || 'U')[0].toUpperCase()}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={s.creatorMeta}>
            <Text style={s.creatorName}>{getDisplayName(creator)}</Text>
            <Text style={s.timeAgoText}>
              {bondup.createdAt ? timeAgo(bondup.createdAt) : formatDateTime(bondup.dateTime)}
            </Text>
          </View>

          <View style={s.categoryBadge}>
            <Text style={s.categoryText}>
              {activityLabel.toUpperCase()} 
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

      {/* ── Action button ── */}
      {isOwner ? (
        <TouchableOpacity
          style={s.manageBtn}
          onPress={() => onPress?.(bondup)}
          activeOpacity={0.8}
        >
          <Text style={s.manageBtnText}>Manage</Text>
        </TouchableOpacity>
      ) : hasJoined ? (
        <View style={s.joinedButtonsContainer}>
          <TouchableOpacity
            style={s.chatBtn}
            onPress={() => onJoinChat?.(bondup._id)}
            activeOpacity={0.8}
          >
            <Text style={s.chatBtnText}>💬 Join Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.exitBtn}
            onPress={() => onLeave?.(bondup._id)}
            activeOpacity={0.8}
          >
            <Text style={s.exitBtnText}>Exit</Text>
          </TouchableOpacity>
        </View>
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
      </View>
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardBackground: {
    backgroundColor: '#fff',
    padding: 20,
    position: 'relative',
  },
  cardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  cardPattern: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    transform: [{ scale: 2 }],
  },

  // Top row
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    zIndex: 10,
  },
  creatorAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  creatorAvatarFallback: {
    backgroundColor: BRAND,
    justifyContent: 'center',
    alignItems: 'center',
  },
  creatorInitial: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'PlusJakartaSansBold',
  },
  creatorMeta: {
    flex: 1,
    marginLeft: 12,
  },
  creatorName: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSansBold',
    color: '#1f2937',
    marginBottom: 2,
  },
  timeAgoText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans',
    color: '#6b7280',
  },
  categoryBadge: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    // shadowColor: BRAND,
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.2,
    // shadowRadius: 4,
    // elevation: 2,
  },
  categoryText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'PlusJakartaSansBold',
    letterSpacing: 0.5,
  },

  // Location
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    zIndex: 10,
  },
  locationText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSansMedium',
    color: '#6b7280',
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
    fontSize: 20,
    fontFamily: 'PlusJakartaSansBold',
    color: '#1f2937',
    lineHeight: 26,
    marginBottom: 6,
    zIndex: 10,
  },
  description: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans',
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
    zIndex: 10,
  },

  // Info chips
  infoRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
    zIndex: 10,
  },
  infoChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  infoChipRight: {},
  infoChipText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSansMedium',
    color: BRAND,
  },

  // Buttons
  joinBtn: {
    backgroundColor: BRAND,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    width: 160,
    zIndex: 10,
  },
  joinBtnText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'PlusJakartaSansBold',
  },
  joinedBtn: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
    width: 160,
    zIndex: 10,
  },
  joinedBtnText: {
    color: '#059669',
    fontSize: 15,
    fontFamily: 'PlusJakartaSansBold',
  },
  fullBtn: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    width: 160,
    zIndex: 10,
  },
  fullBtnText: {
    color: '#9CA3AF',
    fontSize: 15,
    fontFamily: 'PlusJakartaSansMedium',
  },
  manageBtn: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: BRAND,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    width: 160,
    zIndex: 10,
  },
  manageBtnText: {
    color: BRAND,
    fontSize: 15,
    fontFamily: 'PlusJakartaSansBold',
  },

  // Joined buttons container
  joinedButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    justifyContent: 'center',
    zIndex: 10,
  },
  chatBtn: {
    backgroundColor: BRAND,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    flex: 1,
  },
  chatBtnText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'PlusJakartaSansBold',
  },
  exitBtn: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
    flex: 1,
  },
  exitBtnText: {
    color: '#EF4444',
    fontSize: 14,
    fontFamily: 'PlusJakartaSansBold',
  },
});
