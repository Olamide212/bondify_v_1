/**
 * PlanCard.jsx  —  A single "Plan" card in the feed.
 *
 * Horizontal layout: large author avatar on the left, content on the right.
 */

import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
    MapPin,
    Users,
} from "lucide-react-native";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { colors } from "../../constant/colors";

const BRAND = colors.primary;

// ── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  free: {
    label: "I'm Free 🙌",
    color: "#10B981",
    bg: "#ECFDF5",
  },
  join_me: {
    label: "Join Me! 🎉",
    color: colors.primary,
    bg: "#F1ECFF",
  },
  not_free: {
    label: "Not Available 😴",
    color: "#EF4444",
    bg: "#FEF2F2",
  },
};
// ── Activity label map ────────────────────────────────────────────────────────
const ACTIVITY_LABELS = {
  coffee: "☕ Coffee",
  gym: "💪 Gym",
  movies: "🎬 Movies",
  food: "🍔 Food & Drinks",
  study: "📚 Study",
  walk: "🚶 Walk / Hike",
  games: "🎮 Games",
  shopping: "🛍️ Shopping",
  sports: "⚽ Sports",
  music: "🎵 Live Music",
  beach: "🏖️ Beach",
  hangout: "🛋️ Hangout",
  travel: "✈️ Travel",
  art: "🎨 Art / Museum",
  other: "✨ Other",
};
// ── Helpers ──────────────────────────────────────────────────────────────────
const avatarUrl = (user) =>
  user?.profilePhoto || user?.images?.[0]?.url || user?.images?.[0] || null;

const displayName = (user) =>
  [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
  user?.userName ||
  "User";

const timeAgo = (dateStr) => {
  if (!dateStr) return "";
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

// ─────────────────────────────────────────────────────────────────────────────
export default function PlanCard({
  plan,
  currentUserId,
  onJoin,
  onLeave,
  onDelete,
  onPress,
}) {
  const router = useRouter();
  const cfg = STATUS_CONFIG[plan.status] || STATUS_CONFIG.free;
  const isOwner = String(plan.author?._id) === String(currentUserId);
  const hasJoined = plan.hasJoined;
  const participants = plan.participants || [];
  const days = plan.days || [];

  const handleNavigateToProfile = () => {
    if (plan.author?._id) {
      router.push(`/user-feed-profile/${plan.author._id}`);
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress?.(plan)}
      activeOpacity={0.8}
    >
      {/* Status badge — top right */}
      <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
        <Text style={[styles.statusText, { color: cfg.color }]}>
          {cfg.label}
        </Text>
      </View>

      <View style={styles.row}>
        {/* ── Left: large avatar ── */}
        <TouchableOpacity onPress={handleNavigateToProfile} activeOpacity={0.7}>
          {avatarUrl(plan.author) ? (
            <Image
              source={{ uri: avatarUrl(plan.author) }}
              style={styles.authorAvatar}
              cachePolicy="memory-disk"
              transition={150}
            />
          ) : (
            <View style={[styles.authorAvatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitial}>
                {displayName(plan.author)?.[0]?.toUpperCase()}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* ── Right: content ── */}
        <View style={styles.content}>
          {/* Name + time */}
          <TouchableOpacity onPress={handleNavigateToProfile} activeOpacity={0.7}>
            <Text style={styles.authorName}>{displayName(plan.author)}</Text>
          </TouchableOpacity>
          <Text style={styles.timeAgoText}>{timeAgo(plan.createdAt)}</Text>

          {/* Note */}
          {!!plan.note && (
            <Text style={styles.note} numberOfLines={2}>
              {plan.note}
            </Text>
          )}

          {/* Activity */}
          {!!plan.activity && (
            <View style={styles.activityChip}>
              <Text style={styles.activityText}>
                {ACTIVITY_LABELS[plan.activity] || plan.activity}
              </Text>
            </View>
          )}

          {/* Days */}
          {days.length > 0 && (
            <View style={styles.daysRow}>
              {days.map((d) => (
                <View key={d} style={styles.dayTag}>
                  <Text style={styles.dayTagText}>{d}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Location */}
          {!!plan.location?.name && (
            <View style={styles.metaRow}>
              <MapPin size={13} color="#888" />
              <Text style={styles.metaText} numberOfLines={1}>
                {plan.location.name}
              </Text>
            </View>
          )}

          {/* Bottom: participants + action */}
          <View style={styles.bottomRow}>
            <View style={styles.participantsRow}>
              {participants.slice(0, 4).map((pt, i) => {
                const u = pt.user || pt;
                return avatarUrl(u) ? (
                  <Image
                    key={String(u._id || i)}
                    source={{ uri: avatarUrl(u) }}
                    style={[
                      styles.participantAvatar,
                      i > 0 && { marginLeft: -6 },
                    ]}
                    cachePolicy="memory-disk"
                    transition={150}
                  />
                ) : (
                  <View
                    key={String(u._id || i)}
                    style={[
                      styles.participantAvatar,
                      styles.participantAvatarFallback,
                      i > 0 && { marginLeft: -6 },
                    ]}
                  >
                    <Text style={styles.participantInitial}>
                      {displayName(u)?.[0]?.toUpperCase()}
                    </Text>
                  </View>
                );
              })}
              {participants.length > 0 && (
                <View style={styles.countBadge}>
                  <Users size={11} color="#666" />
                  <Text style={styles.countText}>{participants.length}</Text>
                </View>
              )}
            </View>

            {plan.status !== "not_free" && !isOwner && (
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  hasJoined ? styles.leaveBtn : styles.joinBtn,
                ]}
                onPress={() =>
                  hasJoined ? onLeave?.(plan._id) : onJoin?.(plan._id)
                }
              >
                <Text
                  style={[
                    styles.actionBtnText,
                    hasJoined ? styles.leaveBtnText : styles.joinBtnText,
                  ]}
                >
                  {hasJoined ? "Leave" : "Join"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginBottom: 10,
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  authorAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  avatarFallback: {
    backgroundColor: BRAND,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    color: "#fff",
    fontSize: 28,
    fontFamily: "PlusJakartaSansBold",
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  authorName: {
    fontSize: 16,
    fontFamily: "PlusJakartaSansBold",
    color: "#111",
  },
  timeAgoText: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans",
    color: "#BBB",
    marginBottom: 6,
  },
  statusBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  statusText: {
    fontSize: 12,
    fontFamily: "PlusJakartaSansBold",
  },
  note: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans",
    color: "#333",
    lineHeight: 19,
    marginBottom: 6,
  },
  activityChip: {
    alignSelf: "flex-start",
    backgroundColor: "#F1ECFF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 6,
  },
  activityText: {
    fontSize: 12,
    fontFamily: "PlusJakartaSansBold",
    color: BRAND,
  },
  daysRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    marginBottom: 6,
  },
  dayTag: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  dayTagText: {
    fontSize: 11,
    fontFamily: "PlusJakartaSansBold",
    color: "#555",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 3,
  },
  metaText: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans",
    color: "#888",
    flex: 1,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  participantsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  participantAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#fff",
  },
  participantAvatarFallback: {
    backgroundColor: colors.tertiary,
    justifyContent: "center",
    alignItems: "center",
  },
  participantInitial: {
    color: "#fff",
    fontSize: 10,
    fontFamily: "PlusJakartaSansBold",
  },
  countBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginLeft: 6,
  },
  countText: {
    fontSize: 11,
    fontFamily: "PlusJakartaSansMedium",
    color: "#666",
  },
  actionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  joinBtn: {
    backgroundColor: BRAND,
  },
  leaveBtn: {
    backgroundColor: "#F3F4F6",
  },
  actionBtnText: {
    fontSize: 12,
    fontFamily: "PlusJakartaSansBold",
  },
  joinBtnText: {
    color: "#fff",
  },
  leaveBtnText: {
    color: "#666",
  },
});
