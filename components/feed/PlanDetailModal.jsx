/**
 * PlanDetailModal.jsx  —  Detail view for a Plan.
 *
 * Shows full plan info, all participants, and action buttons
 * (join/leave, start chatting, delete).
 */

import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
    Clock,
    MapPin,
    MessageCircle,
    Users,
    X,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { colors } from "../../constant/colors";
import BaseModal from "../modals/BaseModal";

const BRAND = colors.primary;

const STATUS_CONFIG = {
  free: { label: "I'm Free for Plans 🙌", color: "#10B981", bg: "#ECFDF5" },
  join_me: { label: "Join Me! 🎉", color: BRAND, bg: "#F1ECFF" },
  not_free: { label: "Not Available 😴", color: "#EF4444", bg: "#FEF2F2" },
};

const avatarUrl = (u) =>
  u?.profilePhoto || u?.images?.[0]?.url || u?.images?.[0] || null;

const displayName = (u) =>
  [u?.firstName, u?.lastName].filter(Boolean).join(" ") || u?.userName || "User";

const calcRemaining = (exp) => {
  if (!exp) return "";
  const d = new Date(exp) - Date.now();
  if (d <= 0) return "Expired";
  const h = Math.floor(d / 3600000);
  const m = Math.floor((d % 3600000) / 60000);
  const s = Math.floor((d % 60000) / 1000);
  if (h > 0) return `${h}h ${m}m left`;
  if (m > 0) return `${m}m ${s}s left`;
  return `${s}s left`;
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

export default function PlanDetailModal({
  visible,
  plan,
  currentUserId,
  onClose,
  onJoin,
  onLeave,
  onDelete,
  onStartChat,
}) {
  const router = useRouter();
  const cfg = STATUS_CONFIG[plan?.status] || STATUS_CONFIG.free;
  const isOwner = plan ? String(plan.author?._id) === String(currentUserId) : false;
  const hasJoined = plan?.hasJoined ?? false;
  const participants = plan?.participants || [];
  const remaining = useCountdown(plan?.expiresAt);

  if (!plan) return null;

  const canChat = hasJoined || isOwner;
  const showGroupChat = participants.length >= 1;

  return (
    <BaseModal visible={visible} onClose={onClose}>
      <ScrollView contentContainerStyle={s.body}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerTitle}>Plan Details</Text>
          <TouchableOpacity onPress={onClose} hitSlop={10}>
            <X size={22} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Status badge */}
        <View style={[s.statusBadge, { backgroundColor: cfg.bg }]}>
          <Text style={[s.statusText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>

        {/* Author */}
        <TouchableOpacity
          style={s.authorRow}
          onPress={() => {
            onClose();
            router.push(`/user-feed-profile/${plan.author?._id}`);
          }}
          activeOpacity={0.7}
        >
          {avatarUrl(plan.author) ? (
            <Image source={{ uri: avatarUrl(plan.author) }} style={s.avatar} cachePolicy="memory-disk" transition={150} />
          ) : (
            <View style={[s.avatar, s.avatarFallback]}>
              <Text style={s.avatarInitial}>
                {displayName(plan.author)?.[0]?.toUpperCase()}
              </Text>
            </View>
          )}
          <View style={{ marginLeft: 10 }}>
            <Text style={s.authorName}>{displayName(plan.author)}</Text>
            <Text style={s.authorSub}>
              {isOwner ? "Your plan" : "Tap to view profile"}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Note */}
        {!!plan.note && <Text style={s.note}>{plan.note}</Text>}

        {/* Meta */}
        {!!plan.activity && (
          <View style={s.metaRow}>
            <Text style={s.metaLabel}>Activity</Text>
            <Text style={s.metaValue}>{plan.activity}</Text>
          </View>
        )}
        {!!plan.location?.name && (
          <View style={s.metaRow}>
            <MapPin size={15} color="#888" />
            <Text style={s.metaValue}>{plan.location.name}</Text>
          </View>
        )}
        <View style={s.metaRow}>
          <Clock size={15} color={remaining === "Expired" ? "#EF4444" : "#888"} />
          <Text style={[s.metaValue, remaining === "Expired" && { color: "#EF4444" }]}>
            {remaining}
          </Text>
        </View>

        {/* Participants */}
        <Text style={s.sectionTitle}>
          Participants ({participants.length})
        </Text>
        {participants.length === 0 ? (
          <Text style={s.emptyParticipants}>No one has joined yet. Be the first!</Text>
        ) : (
          participants.map((pt) => {
            const u = pt.user || pt;
            return (
              <TouchableOpacity
                key={String(u._id)}
                style={s.participantRow}
                onPress={() => {
                  onClose();
                  router.push(`/user-feed-profile/${u._id}`);
                }}
                activeOpacity={0.7}
              >
                {avatarUrl(u) ? (
                  <Image source={{ uri: avatarUrl(u) }} style={s.participantAvatar} cachePolicy="memory-disk" transition={150} />
                ) : (
                  <View style={[s.participantAvatar, s.avatarFallback]}>
                    <Text style={s.participantInitial}>
                      {displayName(u)?.[0]?.toUpperCase()}
                    </Text>
                  </View>
                )}
                <Text style={s.participantName}>{displayName(u)}</Text>
              </TouchableOpacity>
            );
          })
        )}

        {/* Actions */}
        <View style={s.actions}>
          {/* Join / Leave */}
          {plan.status !== "not_free" && !isOwner && (
            <TouchableOpacity
              style={[s.actionBtn, hasJoined ? s.leaveBtn : s.joinBtn]}
              onPress={() => (hasJoined ? onLeave?.(plan._id) : onJoin?.(plan._id))}
            >
              <Users size={18} color={hasJoined ? "#666" : "#fff"} />
              <Text style={[s.actionBtnText, hasJoined ? s.leaveBtnText : s.joinBtnText]}>
                {hasJoined ? "Leave Plan" : "Join Plan"}
              </Text>
            </TouchableOpacity>
          )}

          {/* Chat — when 2+ participants, show group chat option */}
          {canChat && showGroupChat && (
            <TouchableOpacity
              style={[s.actionBtn, s.chatBtn]}
              onPress={() => onStartChat?.(plan)}
            >
              <MessageCircle size={18} color="#fff" />
              <Text style={[s.actionBtnText, { color: "#fff" }]}>Group Chat</Text>
            </TouchableOpacity>
          )}

          {/* Chat — 1 participant, DM the other party */}
          {canChat && participants.length === 1 && (
            <TouchableOpacity
              style={[s.actionBtn, s.chatBtn]}
              onPress={() => onStartChat?.(plan)}
            >
              <MessageCircle size={18} color="#fff" />
              <Text style={[s.actionBtnText, { color: "#fff" }]}>Start Chat</Text>
            </TouchableOpacity>
          )}

          {/* Delete (owner only) */}
          {isOwner && (
            <TouchableOpacity
              style={[s.actionBtn, s.deleteBtn]}
              onPress={() => {
                onDelete?.(plan._id);
                onClose();
              }}
            >
              <X size={18} color="#EF4444" />
              <Text style={[s.actionBtnText, { color: "#EF4444" }]}>Remove Plan</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </BaseModal>
  );
}

const s = StyleSheet.create({
  body: { padding: 16, paddingBottom: 40 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "OutfitBold",
    color: '#E5E5E5',
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 14,
    fontFamily: "OutfitBold",
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarFallback: {
    backgroundColor: BRAND,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "OutfitBold",
  },
  authorName: {
    fontSize: 15,
    fontFamily: "OutfitBold",
    color: '#E5E5E5',
  },
  authorSub: {
    fontSize: 12,
    fontFamily: "Outfit",
    color: "#999",
  },
  note: {
    fontSize: 15,
    fontFamily: "Outfit",
    color: "#222",
    lineHeight: 22,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  metaLabel: {
    fontSize: 13,
    fontFamily: "OutfitBold",
    color: '#9CA3AF',
  },
  metaValue: {
    fontSize: 13,
    fontFamily: "Outfit",
    color: '#9CA3AF',
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: "OutfitBold",
    color: '#E5E5E5',
    marginTop: 18,
    marginBottom: 10,
  },
  emptyParticipants: {
    fontSize: 13,
    fontFamily: "Outfit",
    color: "#BBB",
    fontStyle: "italic",
  },
  participantRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  participantAvatar: { width: 34, height: 34, borderRadius: 17 },
  participantInitial: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "OutfitBold",
  },
  participantName: {
    fontSize: 14,
    fontFamily: "OutfitMedium",
    color: "#222",
    marginLeft: 10,
  },
  actions: { marginTop: 20, gap: 10 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  joinBtn: { backgroundColor: BRAND },
  leaveBtn: { backgroundColor: '#1E1E1E' },
  chatBtn: { backgroundColor: "#10B981" },
  deleteBtn: { backgroundColor: '#2A1A1A' },
  actionBtnText: {
    fontSize: 14,
    fontFamily: "OutfitBold",
  },
  joinBtnText: { color: "#fff" },
  leaveBtnText: { color: '#9CA3AF' },
});
