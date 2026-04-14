/**
 * Message Requests Screen
 * 
 * Standalone screen showing all pending message requests (compliments/photo comments)
 * from users who haven't matched yet. Each request can be tapped to view the full
 * message and accept/decline.
 */

import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { ArrowLeft, Clock, Inbox, User } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
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
    return `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return `${seconds}s`;
  }
};

const getFirstName = (fullName) => {
  const n = String(fullName || "").trim();
  return n ? n.split(/\s+/)[0] : "Unknown";
};

// ── Request Item Component ────────────────────────────────────────────────────

const RequestItem = ({ request, onPress }) => {
  const {
    fromUser,
    content,
    type,
    timeRemaining,
    expiresAt,
  } = request;

  const [remaining, setRemaining] = useState(timeRemaining || 0);

  // Live countdown timer
  useEffect(() => {
    if (remaining <= 0) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const newRemaining = Math.max(0, expiry - now);
      setRemaining(newRemaining);

      if (newRemaining <= 0) {
        clearInterval(interval);
      }
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [expiresAt]);

  const isExpired = remaining <= 0;
  const isUrgent = remaining > 0 && remaining < 24 * 60 * 60 * 1000;

  const senderImage = fromUser?.images?.[0]?.url || null;
  const senderName = getFirstName(fromUser?.firstName);
  const senderAge = fromUser?.age;
  const isVerified = fromUser?.isVerified;

  return (
    <TouchableOpacity
      style={[styles.requestItem, isExpired && styles.requestItemExpired]}
      onPress={() => !isExpired && onPress(request)}
      activeOpacity={0.8}
      disabled={isExpired}
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
            <User size={22} color="#fff" />
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.requestContent}>
        <View style={styles.nameRow}>
          <Text style={styles.senderName}>{senderName}</Text>
          {senderAge && <Text style={styles.senderAge}>, {senderAge}</Text>}
          {isVerified && <VerifiedIcon style={styles.verifiedBadge} />}
        </View>
        <Text style={styles.messagePreview} numberOfLines={1}>
          {type === "photo_comment" ? "📸 " : "💌 "}
          {content}
        </Text>
      </View>

      {/* Timer */}
      <View style={[styles.timerContainer, isUrgent && styles.timerUrgent]}>
        <Clock size={12} color={isUrgent ? "#EF4444" : "#9CA3AF"} />
        <Text style={[styles.timerText, isUrgent && styles.timerTextUrgent]}>
          {formatTimeRemaining(remaining)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function MessageRequestsScreen() {
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchRequests = useCallback(async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      
      const response = await MessageRequestService.getReceivedRequests();
      if (response.success) {
        setRequests(response.data || []);
      }
    } catch (error) {
      console.warn("Failed to fetch message requests:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleRefresh = () => {
    fetchRequests(true);
  };

  const handleRequestPress = (request) => {
    router.push({
      pathname: "/message-request-preview",
      params: {
        requestId: request._id || request.id,
        requestData: JSON.stringify(request),
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Message Requests</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Info banner */}
      <View style={styles.infoBanner}>
        <Text style={styles.infoBannerText}>
          These are messages from people you haven't matched with yet. 
          Accept to match and start chatting.
        </Text>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading requests...</Text>
        </View>
      ) : requests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Inbox size={64} color="#4B5563" />
          <Text style={styles.emptyTitle}>No requests yet</Text>
          <Text style={styles.emptySubtitle}>
            When someone sends you a compliment or comments on your photo, 
            it will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item._id || item.id}
          renderItem={({ item }) => (
            <RequestItem request={item} onPress={handleRequestPress} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
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

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.background,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "PlusJakartaSansBold",
    color: "#fff",
  },
  headerSpacer: {
    width: 32,
  },

  // Info banner
  infoBanner: {
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#262626",
  },
  infoBannerText: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans",
    color: "#9CA3AF",
    lineHeight: 18,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: "PlusJakartaSans",
    color: "#9CA3AF",
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 20,
    fontFamily: "PlusJakartaSansBold",
    color: "#E5E5E5",
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: "PlusJakartaSans",
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 20,
  },

  // List
  listContent: {
    paddingVertical: 8,
  },

  // Request item
  requestItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: "#262626",
  },
  requestItemExpired: {
    opacity: 0.5,
  },

  // Avatar
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarFallback: {
    backgroundColor: "#333",
    alignItems: "center",
    justifyContent: "center",
  },

  // Content
  requestContent: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  senderName: {
    fontSize: 15,
    fontFamily: "PlusJakartaSansBold",
    color: "#E5E5E5",
    textTransform: "capitalize",
  },
  senderAge: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans",
    color: "#9CA3AF",
  },
  verifiedBadge: {
    width: 14,
    height: 14,
    marginLeft: 4,
  },
  messagePreview: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans",
    color: "#9CA3AF",
  },

  // Timer
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  timerUrgent: {
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
});
