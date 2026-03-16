/**
 * PlanCard.jsx  —  A single "Plan" card in the feed.
 *
 * Shows: author avatar + name, status badge, optional note/activity,
 *        time remaining, participant avatars, and join/leave button.
 */

import { useRouter } from "expo-router";
import {
    Calendar,
    Clock,
    MapPin,
    Users,
    X,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
    Image,
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
    label: "I'm Free for Plans 🙌",
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

// ── Helpers ──────────────────────────────────────────────────────────────────
const avatarUrl = (user) =>
  user?.profilePhoto || user?.images?.[0]?.url || user?.images?.[0] || null;

const displayName = (user) =>
  [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
  user?.userName ||
  "User";

const calcRemaining = (expiresAt) => {
  if (!expiresAt) return "";
  const diff = new Date(expiresAt) - Date.now();
  if (diff <= 0) return "Expired";
  const hrs = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  if (hrs > 0) return `${hrs}h ${mins}m left`;
  if (mins > 0) return `${mins}m ${secs}s left`;
  return `${secs}s left`;
};

const useCountdown = (expiresAt) => {
  const [remaining, setRemaining] = useState(() => calcRemaining(expiresAt));
  useEffect(() => {
    setRemaining(calcRemaining(expiresAt));
    if (!expiresAt) return;
    const id = setInterval(() => {
      const val = calcRemaining(expiresAt);
      setRemaining(val);
      if (val === "Expired") clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  return remaining;
};

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
  const remaining = useCountdown(plan.expiresAt);

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
      {/* Status badge */}
      <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
        <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
      </View>

      {/* Author row */}
      <TouchableOpacity
        style={styles.authorRow}
        onPress={handleNavigateToProfile}
        activeOpacity={0.7}
      >
        {avatarUrl(plan.author) ? (
          <Image source={{ uri: avatarUrl(plan.author) }} style={styles.authorAvatar} />
        ) : (
          <View style={[styles.authorAvatar, styles.avatarFallback]}>
            <Text style={styles.avatarInitial}>
              {displayName(plan.author)?.[0]?.toUpperCase()}
            </Text>
          </View>
        )}
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.authorName}>{displayName(plan.author)}</Text>
          <Text style={styles.timeAgoText}>{timeAgo(plan.createdAt)}</Text>
        </View>

        {isOwner && (
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => onDelete?.(plan._id)}
            hitSlop={10}
          >
            <X size={18} color="#999" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* Note */}
      {!!plan.note && <Text style={styles.note}>{plan.note}</Text>}

      {/* Activity tag */}
      {!!plan.activity && (
        <View style={styles.activityRow}>
          <Calendar size={14} color={BRAND} />
          <Text style={styles.activityText}>{plan.activity}</Text>
        </View>
      )}

      {/* Location */}
      {!!plan.location?.name && (
        <View style={styles.metaRow}>
          <MapPin size={14} color="#888" />
          <Text style={styles.metaText}>{plan.location.name}</Text>
        </View>
      )}

      {/* Expiry timer */}
      <View style={styles.metaRow}>
        <Clock size={14} color={remaining === "Expired" ? "#EF4444" : "#888"} />
        <Text
          style={[
            styles.metaText,
            remaining === "Expired" && { color: "#EF4444" },
          ]}
        >
          {remaining}
        </Text>
      </View>

      {/* Bottom row: participants + action */}
      <View style={styles.bottomRow}>
        {/* Participant avatars */}
        <View style={styles.participantsRow}>
          {participants.slice(0, 5).map((pt, i) => {
            const u = pt.user || pt;
            return avatarUrl(u) ? (
              <Image
                key={String(u._id || i)}
                source={{ uri: avatarUrl(u) }}
                style={[styles.participantAvatar, i > 0 && { marginLeft: -8 }]}
              />
            ) : (
              <View
                key={String(u._id || i)}
                style={[
                  styles.participantAvatar,
                  styles.participantAvatarFallback,
                  i > 0 && { marginLeft: -8 },
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
              <Users size={12} color="#666" />
              <Text style={styles.countText}>{participants.length}</Text>
            </View>
          )}
        </View>

        {/* Action button */}
        {plan.status !== "not_free" && !isOwner && (
          <TouchableOpacity
            style={[
              styles.actionBtn,
              hasJoined ? styles.leaveBtn : styles.joinBtn,
            ]}
            onPress={() => (hasJoined ? onLeave?.(plan._id) : onJoin?.(plan._id))}
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
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 13,
    fontFamily: "PlusJakartaSansBold",
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  authorAvatar: { width: 40, height: 40, borderRadius: 20 },
  avatarFallback: {
    backgroundColor: BRAND,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "PlusJakartaSansBold",
  },
  authorName: {
    fontSize: 14,
    fontFamily: "PlusJakartaSansBold",
    color: "#111",
  },
  timeAgoText: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans",
    color: "#BBB",
  },
  deleteBtn: { padding: 4 },
  note: {
    fontSize: 15,
    fontFamily: "PlusJakartaSans",
    color: "#222",
    lineHeight: 22,
    marginBottom: 8,
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  activityText: {
    fontSize: 13,
    fontFamily: "PlusJakartaSansMedium",
    color: BRAND,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  metaText: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans",
    color: "#888",
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  participantsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  participantAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
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
    fontSize: 11,
    fontFamily: "PlusJakartaSansBold",
  },
  countBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginLeft: 8,
  },
  countText: {
    fontSize: 12,
    fontFamily: "PlusJakartaSansMedium",
    color: "#666",
  },
  actionBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  joinBtn: {
    backgroundColor: BRAND,
  },
  leaveBtn: {
    backgroundColor: "#F3F4F6",
  },
  actionBtnText: {
    fontSize: 13,
    fontFamily: "PlusJakartaSansBold",
  },
  joinBtnText: {
    color: "#fff",
  },
  leaveBtnText: {
    color: "#666",
  },
});
