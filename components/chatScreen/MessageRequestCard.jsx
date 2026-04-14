/**
 * MessageRequestCard.jsx
 * 
 * Card component displaying a message request with:
 * - Sender info (avatar, name, verification)
 * - Request content (compliment/photo comment)
 * - Countdown timer showing time remaining
 * - Accept/Decline action buttons
 */

import { Image } from "expo-image";
import { Check, Clock, MessageCircle, User, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { colors } from "../../constant/colors";
import VerifiedIcon from "../ui/VerifiedIcon";

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatTimeRemaining = (ms) => {
  if (ms <= 0) return "Expired";
  
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h left`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m left`;
  } else if (minutes > 0) {
    return `${minutes}m left`;
  } else {
    return `${seconds}s left`;
  }
};

const getFirstName = (fullName) => {
  const n = String(fullName || "").trim();
  return n ? n.split(/\s+/)[0] : "Unknown";
};

// ── Component ─────────────────────────────────────────────────────────────────

const MessageRequestCard = ({
  request,
  onAccept,
  onDecline,
  onViewProfile,
  isAccepting = false,
  isDeclining = false,
}) => {
  const {
    fromUser,
    content,
    type,
    imageUrl,
    expiresAt,
    timeRemaining: initialTimeRemaining,
    createdAt,
  } = request;

  // Live countdown timer
  const [timeRemaining, setTimeRemaining] = useState(initialTimeRemaining || 0);

  useEffect(() => {
    if (timeRemaining <= 0) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const remaining = Math.max(0, expiry - now);
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const isExpired = timeRemaining <= 0;
  const isLowTime = timeRemaining > 0 && timeRemaining < 24 * 60 * 60 * 1000; // Less than 24h

  // Sender details
  const senderImage = fromUser?.images?.[0]?.url || null;
  const senderName = getFirstName(fromUser?.firstName);
  const senderAge = fromUser?.age;
  const senderLocation = fromUser?.location?.city;
  const isVerified = fromUser?.isVerified;

  return (
    <View style={[styles.card, isExpired && styles.cardExpired]}>
      {/* ── Header: Sender Info ── */}
      <TouchableOpacity 
        style={styles.header} 
        onPress={() => onViewProfile?.(fromUser)}
        activeOpacity={0.8}
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {senderImage ? (
            <Image
              source={{ uri: senderImage }}
              style={styles.avatar}
              contentFit="cover"
              transition={150}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <User size={20} color="#fff" />
            </View>
          )}
        </View>

        {/* Name & meta */}
        <View style={styles.senderInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.senderName}>{senderName}</Text>
            {senderAge && <Text style={styles.senderAge}>, {senderAge}</Text>}
            {isVerified && <VerifiedIcon style={styles.verifiedBadge} />}
          </View>
          {senderLocation && (
            <Text style={styles.senderLocation} numberOfLines={1}>
              {senderLocation}
            </Text>
          )}
        </View>

        {/* Timer badge */}
        <View style={[styles.timerBadge, isLowTime && styles.timerBadgeUrgent]}>
          <Clock size={12} color={isLowTime ? "#EF4444" : "#9CA3AF"} />
          <Text style={[styles.timerText, isLowTime && styles.timerTextUrgent]}>
            {formatTimeRemaining(timeRemaining)}
          </Text>
        </View>
      </TouchableOpacity>

      {/* ── Photo Preview (for photo_comment type) ── */}
      {type === "photo_comment" && imageUrl && (
        <View style={styles.photoPreviewContainer}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.photoPreview}
            contentFit="cover"
            transition={150}
          />
        </View>
      )}

      {/* ── Message Content ── */}
      <View style={styles.contentContainer}>
        <View style={styles.messageIcon}>
          <MessageCircle size={16} color={colors.primary} />
        </View>
        <Text style={styles.contentText} numberOfLines={4}>
          {content}
        </Text>
      </View>

      {/* ── Type label ── */}
      <View style={styles.typeLabelContainer}>
        <Text style={styles.typeLabel}>
          {type === "photo_comment" ? "📸 Photo Comment" : "💌 Compliment"}
        </Text>
      </View>

      {/* ── Actions ── */}
      {!isExpired && (
        <View style={styles.actions}>
          {/* Decline button */}
          <TouchableOpacity
            style={[styles.actionBtn, styles.declineBtn]}
            onPress={() => onDecline?.(request._id || request.id)}
            disabled={isDeclining || isAccepting}
            activeOpacity={0.85}
          >
            {isDeclining ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <>
                <X size={16} color="#EF4444" strokeWidth={2.5} />
                <Text style={styles.declineBtnText}>Decline</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Accept button */}
          <TouchableOpacity
            style={[styles.actionBtn, styles.acceptBtn]}
            onPress={() => onAccept?.(request._id || request.id)}
            disabled={isAccepting || isDeclining}
            activeOpacity={0.85}
          >
            {isAccepting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Check size={16} color="#fff" strokeWidth={2.5} />
                <Text style={styles.acceptBtnText}>Accept & Match</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* ── Expired overlay ── */}
      {isExpired && (
        <View style={styles.expiredOverlay}>
          <Text style={styles.expiredText}>Request Expired</Text>
        </View>
      )}
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  cardExpired: {
    opacity: 0.6,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarFallback: {
    backgroundColor: "#333",
    alignItems: "center",
    justifyContent: "center",
  },
  senderInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  senderName: {
    fontSize: 16,
    fontFamily: "PlusJakartaSansBold",
    color: "#E5E5E5",
    textTransform: "capitalize",
  },
  senderAge: {
    fontSize: 15,
    fontFamily: "PlusJakartaSans",
    color: "#9CA3AF",
  },
  verifiedBadge: {
    width: 14,
    height: 14,
    marginLeft: 4,
  },
  senderLocation: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans",
    color: "#6B7280",
    marginTop: 2,
  },

  // Timer
  timerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#262626",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  timerBadgeUrgent: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
  },
  timerText: {
    fontSize: 11,
    fontFamily: "PlusJakartaSansMedium",
    color: "#9CA3AF",
  },
  timerTextUrgent: {
    color: "#EF4444",
  },

  // Photo preview
  photoPreviewContainer: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: "hidden",
  },
  photoPreview: {
    width: "100%",
    height: 120,
    borderRadius: 12,
  },

  // Content
  contentContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#262626",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  messageIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  contentText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "PlusJakartaSans",
    color: "#E5E5E5",
    lineHeight: 20,
  },

  // Type label
  typeLabelContainer: {
    marginBottom: 14,
  },
  typeLabel: {
    fontSize: 12,
    fontFamily: "PlusJakartaSansMedium",
    color: "#6B7280",
  },

  // Actions
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  declineBtn: {
    backgroundColor: "rgba(239, 68, 68, 0.12)",
  },
  declineBtnText: {
    fontSize: 14,
    fontFamily: "PlusJakartaSansBold",
    color: "#EF4444",
  },
  acceptBtn: {
    backgroundColor: colors.primary,
  },
  acceptBtnText: {
    fontSize: 14,
    fontFamily: "PlusJakartaSansBold",
    color: "#fff",
  },

  // Expired
  expiredOverlay: {
    alignItems: "center",
    paddingVertical: 12,
  },
  expiredText: {
    fontSize: 14,
    fontFamily: "PlusJakartaSansMedium",
    color: "#6B7280",
  },
});

export default MessageRequestCard;
