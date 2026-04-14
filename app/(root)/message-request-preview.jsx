/**
 * Message Request Preview Screen
 * 
 * Chat-like screen showing the full message request with:
 * - Sender info in header
 * - Message displayed as chat bubble
 * - Photo preview for photo comments
 * - Countdown timer
 * - Accept/Decline actions
 */

import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Check, Clock, User, X } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import VerifiedIcon from "../../components/ui/VerifiedIcon";
import { colors } from "../../constant/colors";
import MessageRequestService from "../../services/messageRequestService";

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

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function MessageRequestPreviewScreen() {
  const router = useRouter();
  const { requestId, requestData } = useLocalSearchParams();

  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Parse request data
  const request = useMemo(() => {
    try {
      return requestData ? JSON.parse(requestData) : null;
    } catch {
      return null;
    }
  }, [requestData]);

  const {
    fromUser,
    content,
    type,
    imageUrl,
    expiresAt,
    createdAt,
  } = request || {};

  // Sender details
  const senderImage = fromUser?.images?.[0]?.url || null;
  const senderName = getFirstName(fromUser?.firstName);
  const senderFullName = fromUser?.firstName || "Unknown";
  const senderAge = fromUser?.age;
  const senderLocation = fromUser?.location?.city;
  const isVerified = fromUser?.isVerified;

  // Update countdown timer
  useEffect(() => {
    if (!expiresAt) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const remaining = Math.max(0, expiry - now);
      setTimeRemaining(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const isExpired = timeRemaining <= 0;
  const isUrgent = timeRemaining > 0 && timeRemaining < 24 * 60 * 60 * 1000;

  // Handle accept
  const handleAccept = async () => {
    try {
      setIsAccepting(true);
      const response = await MessageRequestService.acceptRequest(requestId);
      if (response.success) {
        Alert.alert(
          "Match Created! 🎉",
          `You and ${senderName} are now matched! Start chatting.`,
          [
            {
              text: "Go to Chats",
              onPress: () => router.replace("/(root)/(tabs)/chats"),
            },
          ]
        );
      } else {
        Alert.alert("Error", response.message || "Failed to accept request");
      }
    } catch (error) {
      console.warn("Failed to accept request:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setIsAccepting(false);
    }
  };

  // Handle decline
  const handleDecline = async () => {
    Alert.alert(
      "Decline Request",
      `Are you sure you want to decline this message from ${senderName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Decline",
          style: "destructive",
          onPress: async () => {
            try {
              setIsDeclining(true);
              const response = await MessageRequestService.declineRequest(requestId);
              if (response.success) {
                router.back();
              } else {
                Alert.alert("Error", response.message || "Failed to decline request");
              }
            } catch (error) {
              console.warn("Failed to decline request:", error);
              Alert.alert("Error", "Something went wrong. Please try again.");
            } finally {
              setIsDeclining(false);
            }
          },
        },
      ]
    );
  };

  // View profile
  const handleViewProfile = () => {
    if (fromUser?._id || fromUser?.id) {
      router.push(`/profile/${fromUser._id || fromUser.id}`);
    }
  };

  if (!request) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Request not found</Text>
          <TouchableOpacity style={styles.errorButton} onPress={() => router.back()}>
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerProfile} onPress={handleViewProfile}>
          {senderImage ? (
            <Image
              source={{ uri: senderImage }}
              style={styles.headerAvatar}
              contentFit="cover"
              transition={150}
            />
          ) : (
            <View style={[styles.headerAvatar, styles.avatarFallback]}>
              <User size={16} color="#fff" />
            </View>
          )}
          <View style={styles.headerInfo}>
            <View style={styles.headerNameRow}>
              <Text style={styles.headerName}>{senderFullName}</Text>
              {isVerified && <VerifiedIcon style={styles.verifiedBadge} />}
            </View>
            <Text style={styles.headerSubtitle}>
              {senderAge && `${senderAge}`}
              {senderAge && senderLocation && " • "}
              {senderLocation}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerSpacer} />
      </View>

      {/* Timer Banner */}
      <View style={[styles.timerBanner, isUrgent && styles.timerBannerUrgent, isExpired && styles.timerBannerExpired]}>
        <Clock size={14} color={isExpired ? "#9CA3AF" : isUrgent ? "#EF4444" : colors.primary} />
        <Text style={[styles.timerBannerText, isUrgent && styles.timerBannerTextUrgent, isExpired && styles.timerBannerTextExpired]}>
          {isExpired ? "This request has expired" : formatTimeRemaining(timeRemaining)}
        </Text>
      </View>

      {/* Chat Content */}
      <ScrollView 
        style={styles.chatContainer}
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Date indicator */}
        <View style={styles.dateIndicator}>
          <Text style={styles.dateText}>{formatDate(createdAt)}</Text>
        </View>

        {/* Photo preview (for photo comments) */}
        {type === "photo_comment" && imageUrl && (
          <View style={styles.photoContainer}>
            <Text style={styles.photoLabel}>Commented on your photo</Text>
            <Image
              source={{ uri: imageUrl }}
              style={styles.photoPreview}
              contentFit="cover"
              transition={200}
            />
          </View>
        )}

        {/* Message bubble */}
        <View style={styles.messageBubbleContainer}>
          {/* Sender avatar */}
          {senderImage ? (
            <Image
              source={{ uri: senderImage }}
              style={styles.bubbleAvatar}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.bubbleAvatar, styles.avatarFallback]}>
              <User size={14} color="#fff" />
            </View>
          )}

          <View style={styles.bubbleWrapper}>
            <View style={styles.messageBubble}>
              <Text style={styles.messageText}>{content}</Text>
            </View>
            <Text style={styles.messageType}>
              {type === "photo_comment" ? "📸 Photo Comment" : "💌 Compliment"}
            </Text>
          </View>
        </View>

        {/* Info text */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            Accept to match with {senderName} and start chatting. 
            Declining will remove this request.
          </Text>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      {!isExpired && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.declineButton]}
            onPress={handleDecline}
            disabled={isDeclining || isAccepting}
            activeOpacity={0.85}
          >
            {isDeclining ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <>
                <X size={20} color="#EF4444" strokeWidth={2.5} />
                <Text style={styles.declineButtonText}>Decline</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={handleAccept}
            disabled={isAccepting || isDeclining}
            activeOpacity={0.85}
          >
            {isAccepting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Check size={20} color="#fff" strokeWidth={2.5} />
                <Text style={styles.acceptButtonText}>Accept & Match</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Expired state */}
      {isExpired && (
        <View style={styles.expiredContainer}>
          <Text style={styles.expiredText}>
            This request has expired and can no longer be accepted.
          </Text>
          <TouchableOpacity
            style={styles.goBackButton}
            onPress={() => router.back()}
          >
            <Text style={styles.goBackButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },

  // Error
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    fontFamily: "PlusJakartaSans",
    color: "#9CA3AF",
    marginBottom: 16,
  },
  errorButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  errorButtonText: {
    fontSize: 14,
    fontFamily: "PlusJakartaSansBold",
    color: "#fff",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#1A1A1A",
    borderBottomWidth: 1,
    borderBottomColor: "#262626",
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerProfile: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  avatarFallback: {
    backgroundColor: "#333",
    alignItems: "center",
    justifyContent: "center",
  },
  headerInfo: {
    flex: 1,
  },
  headerNameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerName: {
    fontSize: 16,
    fontFamily: "PlusJakartaSansBold",
    color: "#E5E5E5",
    textTransform: "capitalize",
  },
  verifiedBadge: {
    width: 14,
    height: 14,
    marginLeft: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans",
    color: "#9CA3AF",
    marginTop: 2,
  },
  headerSpacer: {
    width: 28,
  },

  // Timer banner
  timerBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    gap: 6,
  },
  timerBannerUrgent: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  timerBannerExpired: {
    backgroundColor: "#1E1E1E",
  },
  timerBannerText: {
    fontSize: 13,
    fontFamily: "PlusJakartaSansMedium",
    color: colors.primary,
  },
  timerBannerTextUrgent: {
    color: "#EF4444",
  },
  timerBannerTextExpired: {
    color: "#9CA3AF",
  },

  // Chat container
  chatContainer: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    paddingBottom: 24,
  },

  // Date indicator
  dateIndicator: {
    alignItems: "center",
    marginBottom: 20,
  },
  dateText: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans",
    color: "#6B7280",
    backgroundColor: "#1E1E1E",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },

  // Photo preview
  photoContainer: {
    marginBottom: 16,
    alignItems: "center",
  },
  photoLabel: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans",
    color: "#9CA3AF",
    marginBottom: 8,
  },
  photoPreview: {
    width: "70%",
    aspectRatio: 1,
    borderRadius: 16,
  },

  // Message bubble
  messageBubbleContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 8,
  },
  bubbleAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  bubbleWrapper: {
    flex: 1,
    maxWidth: "80%",
  },
  messageBubble: {
    backgroundColor: "#2A2A2A",
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageText: {
    fontSize: 15,
    fontFamily: "PlusJakartaSans",
    color: "#E5E5E5",
    lineHeight: 22,
  },
  messageType: {
    fontSize: 11,
    fontFamily: "PlusJakartaSans",
    color: "#6B7280",
    marginTop: 6,
    marginLeft: 4,
  },

  // Info
  infoContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
  },
  infoText: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans",
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 20,
  },

  // Actions
  actionsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: "#1A1A1A",
    borderTopWidth: 1,
    borderTopColor: "#262626",
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  declineButton: {
    backgroundColor: "rgba(239, 68, 68, 0.12)",
  },
  declineButtonText: {
    fontSize: 15,
    fontFamily: "PlusJakartaSansBold",
    color: "#EF4444",
  },
  acceptButton: {
    backgroundColor: colors.primary,
  },
  acceptButtonText: {
    fontSize: 15,
    fontFamily: "PlusJakartaSansBold",
    color: "#fff",
  },

  // Expired
  expiredContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: "#1A1A1A",
    borderTopWidth: 1,
    borderTopColor: "#262626",
    alignItems: "center",
  },
  expiredText: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans",
    color: "#9CA3AF",
    textAlign: "center",
    marginBottom: 12,
  },
  goBackButton: {
    backgroundColor: "#2A2A2A",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  goBackButtonText: {
    fontSize: 14,
    fontFamily: "PlusJakartaSansBold",
    color: "#E5E5E5",
  },
});
