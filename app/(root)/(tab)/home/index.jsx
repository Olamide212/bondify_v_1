// Home.js (updated)
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Bell, SlidersHorizontal } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSelector } from "react-redux";
import ActionButtons from "../../../../components/homeScreen/ActionButtons";
import AroundYou from "../../../../components/homeScreen/AroundYouTab";
import AIAssistantModal from "../../../../components/modals/AIAssistantModal"; // New import
import FilterModal from "../../../../components/modals/FilterModal";
import MatchCelebrationModal from "../../../../components/modals/MatchCelebrationModal";
import NotificationsModal from "../../../../components/modals/NotificationsModal";
import UserProfileModal from "../../../../components/modals/UserProfileModal";
import LogoLoader from "../../../../components/ui/LogoLoader";
import { colors } from "../../../../constant/colors";
import { useProfile } from "../../../../context/ProfileContext";
import { messageService } from "../../../../services/messageService";
import { socketService } from "../../../../services/socketService";

const NOTIFICATIONS_STORAGE_KEY = "@bondify/cache/home/notifications";
const MAX_NOTIFICATIONS = 100;

const safeParse = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const Home = () => {
  const {
    homeCurrentProfileIndex,
    homeProfiles,
    handleHomeSwipe,
    handleHomeSuperLike,
    profilesLoading,
    refreshProfiles,
    homeFilters,
    setHomeFilters,
    matchCelebration,
    setMatchCelebration,
  } = useProfile();

  const { user: currentUser } = useSelector((state) => state.auth);

  const [flashMessage, setFlashMessage] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false); // AI Modal state
  const [selectedProfileId, setSelectedProfileId] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const animation = useSharedValue(1);
  const flashAnim = useSharedValue(0);

  const unreadNotificationsCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications]
  );

  const currentProfile =
    homeProfiles.length > 0
      ? homeProfiles[homeCurrentProfileIndex % homeProfiles.length]
      : null;

  useEffect(() => {
    animation.value = 0;
    animation.value = withTiming(1, { duration: 600 });
  }, [homeCurrentProfileIndex, animation]);

  const showFlashMessage = (direction) => {
    const message = direction === "right" ? "Liked ❤️" : "Passed 👎";
    setFlashMessage(message);

    flashAnim.value = 0;
    flashAnim.value = withTiming(1, { duration: 300 }, () => {
      flashAnim.value = withTiming(0, { duration: 300, delay: 400 }, () => {
        runOnJS(setFlashMessage)(null);
      });
    });
  };

  const handleSwipe = (direction) => {
    if (!currentProfile) return;

    showFlashMessage(direction);
    handleHomeSwipe(direction, currentProfile);
  };

  const handleSuperLike = () => {
    if (!currentProfile) return;

    showFlashMessage("right");
    handleHomeSuperLike(currentProfile);
  };

  const handleViewProfile = () => {
    if (currentProfile) {
      setSelectedProfileId(currentProfile.id);
      setShowProfileModal(true);
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(animation.value, [0, 1], [60, 0]);
    const scale = interpolate(animation.value, [0, 1], [0.9, 1]);

    return {
      transform: [{ translateY }, { scale }],
      opacity: animation.value,
    };
  });

  const flashStyle = useAnimatedStyle(() => {
    return {
      opacity: flashAnim.value,
      transform: [
        { translateY: interpolate(flashAnim.value, [0, 1], [-20, 0]) },
      ],
    };
  });

  useEffect(() => {
    if (!profilesLoading && isRefreshing) {
      setIsRefreshing(false);
    }
  }, [profilesLoading, isRefreshing]);

  useEffect(() => {
    let isMounted = true;

    const hydrateNotifications = async () => {
      try {
        const raw = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
        const parsed = safeParse(raw);

        if (!isMounted || !Array.isArray(parsed)) return;

        const normalized = parsed
          .filter(Boolean)
          .map((item) => ({
            ...item,
            read: Boolean(item?.read),
          }))
          .slice(0, MAX_NOTIFICATIONS);

        setNotifications(normalized);
      } catch (error) {
        console.warn("Failed to hydrate notifications cache:", error?.message || error);
      }
    };

    hydrateNotifications();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const persistNotifications = async () => {
      try {
        await AsyncStorage.setItem(
          NOTIFICATIONS_STORAGE_KEY,
          JSON.stringify(notifications.slice(0, MAX_NOTIFICATIONS))
        );
      } catch (error) {
        console.warn("Failed to persist notifications cache:", error?.message || error);
      }
    };

    persistNotifications();
  }, [notifications]);

  const markNotificationAsRead = useCallback((notificationId) => {
    if (!notificationId) return;

    setNotifications((prev) =>
      prev.map((item) =>
        String(item.id) === String(notificationId)
          ? { ...item, read: true }
          : item
      )
    );
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  }, []);

  useEffect(() => {
    let isMounted = true;

    const mapNotificationPayload = (payload = {}) => ({
      id: payload.id || `${payload.type || "notification"}-${payload.matchId || Date.now()}-${Math.random()}`,
      type: payload.type || "notification",
      title: payload.title || "Notification",
      body: payload.body || "You have a new update.",
      createdAt: payload.createdAt || new Date().toISOString(),
      matchId: payload.matchId,
      userId: payload.userId,
      read: Boolean(payload.read),
    });

    const pushNotification = (payload) => {
      const normalized = mapNotificationPayload(payload);

      setNotifications((prev) => {
        const existing = prev.find((item) => String(item.id) === String(normalized.id));
        const nextNotification = {
          ...normalized,
          read:
            normalized.read ||
            Boolean(existing?.read) ||
            Boolean(showNotificationsModal),
        };

        const deduped = prev.filter((item) => String(item.id) !== String(nextNotification.id));
        return [nextNotification, ...deduped].slice(0, MAX_NOTIFICATIONS);
      });
    };

    const handleNotificationNew = (payload) => pushNotification(payload);
    const handleMatchNew = (payload) => pushNotification(payload);
    const handleMessageNew = ({ matchId, message }) => {
      if (!message) return;

      const senderName =
        message.sender?.name ||
        [message.sender?.firstName, message.sender?.lastName].filter(Boolean).join(" ") ||
        "New message";

      const body =
        message.type === "image"
          ? "Sent you a photo"
          : message.type === "voice"
            ? "Sent you a voice note"
            : message.content || "Sent you a message";

      pushNotification({
        id: `${matchId || message._id || message.id}-${message._id || message.id || Date.now()}`,
        type: "message",
        title: senderName,
        body,
        createdAt: message.createdAt || new Date().toISOString(),
        matchId,
        userId: message.sender?._id || message.sender?.id,
      });
    };

    const connectSocket = async () => {
      const socket = await socketService.connect();
      if (!socket || !isMounted) return;

      socketService.on("notification:new", handleNotificationNew);
      socketService.on("match:new", handleMatchNew);
      socketService.on("message:new", handleMessageNew);
    };

    connectSocket();

    return () => {
      isMounted = false;
      socketService.off("notification:new", handleNotificationNew);
      socketService.off("match:new", handleMatchNew);
      socketService.off("message:new", handleMessageNew);
    };
  }, [showNotificationsModal]);

  const handleOpenNotifications = () => {
    setShowNotificationsModal(true);
  };

  const handlePressNotification = (notification) => {
    if (!notification) return;

    markNotificationAsRead(notification.id);

    if (notification.type === "match" && notification.userId) {
      setSelectedProfileId(notification.userId);
      setShowProfileModal(true);
    }

    setShowNotificationsModal(false);
  };

  if (profilesLoading) {
    return <LogoLoader color={colors.primary} />;
  }

  const hasProfiles = Array.isArray(homeProfiles) && homeProfiles.length > 0;

  const onRefresh = () => {
    setIsRefreshing(true);
    refreshProfiles();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerWrapper}>
        <View className="flex-row justify-end gap-4">
          {/* AI Assistant Button */}
          {/* <Pressable onPress={() => setShowAIModal(true)}>
            <View className="justify-center gap-2 rounded-full bg-secondary w-auto px-3 h-10 flex-row items-center ">
              <Bot size={22} color={colors.primary} />
              <Text className="font-PlusJakartaSansMedium text-primary">AI Chat</Text>
            </View>
          </Pressable> */}

          <View className='flex-row gap-2'>
            <Pressable onPress={handleOpenNotifications}>
              <View className="justify-center items-center rounded-full bg-background w-14 h-14">
                <Bell size={23} color={colors.primary} />
                {unreadNotificationsCount > 0 && (
                  <View style={styles.notificationsBadge}>
                    <Text style={styles.notificationsBadgeText}>
                      {unreadNotificationsCount > 99 ? "99+" : unreadNotificationsCount}
                    </Text>
                  </View>
                )}
              </View>
            </Pressable>

            <Pressable onPress={() => setShowFilterModal(true)}>
              <View className="justify-center items-center rounded-full bg-background w-14 h-14">
                <SlidersHorizontal size={23} color={colors.primary} />
              </View>
            </Pressable>
          </View>
        </View>
      </View>

      {flashMessage && (
        <Animated.View style={[styles.flashMessage, flashStyle]}>
          <Text style={styles.flashText}>{flashMessage}</Text>
        </Animated.View>
      )}

      <ScrollView
        style={styles.aroundYouContainer}
        contentContainerStyle={{ flexGrow: 1, backgroundColor: "#fff" }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {hasProfiles && currentProfile ? (
          <Animated.View style={[animatedStyle, { flex: 1 }]}>
            <AroundYou
              profile={currentProfile}
              onViewProfile={handleViewProfile}
            />
          </Animated.View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No users around you yet</Text>
            <Text style={styles.emptySubtitle}>
              Check back shortly to discover newly registered users.
            </Text>
          </View>
        )}
      </ScrollView>

      {hasProfiles && currentProfile && (
        <View style={styles.actionButtonWrapper}>
          <ActionButtons onSwipe={handleSwipe} onSuperLike={handleSuperLike} Redo={true} />
        </View>
      )}

      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        initialFilters={homeFilters}
        onApply={setHomeFilters}
      />

      <NotificationsModal
        visible={showNotificationsModal}
        notifications={notifications}
        onClose={() => setShowNotificationsModal(false)}
        onMarkAllRead={markAllNotificationsAsRead}
        onClearAll={() => {
          setNotifications([]);
        }}
        onPressNotification={handlePressNotification}
      />

      <UserProfileModal
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        profileId={selectedProfileId}
      />

      {/* AI Assistant Modal */}
      <AIAssistantModal
        visible={showAIModal}
        onClose={() => setShowAIModal(false)}
        fullScreen
      />

      {/* Match Celebration Modal */}
      <MatchCelebrationModal
        visible={!!matchCelebration}
        onClose={() => setMatchCelebration(null)}
        matchedUser={matchCelebration}
        currentUser={currentUser}
        onSendMessage={async (matchedProfile, selectedIceBreaker) => {
          if (matchedProfile?.matchId && selectedIceBreaker) {
            try {
              await messageService.sendMessage(matchedProfile.matchId, {
                content: selectedIceBreaker,
                type: "text",
              });
            } catch (error) {
              console.error("Failed to send ice breaker:", error);
            }
          }
          setMatchCelebration(null);
        }}
        onContinueSwiping={() => {
          setMatchCelebration(null);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 24,
    color: "#111",
    fontFamily: "PlusJakartaSansBold",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#666",
    fontFamily: "PlusJakartaSans",
    textAlign: "center",
  },
  headerWrapper: {
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
    zIndex: 50,
  },
  actionButtonWrapper: {
    position: "absolute",
    bottom: 5,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  flashMessage: {
    position: "absolute",
    top: 80,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    zIndex: 100,
  },
  flashText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  aroundYouContainer: {
    flex: 1,
  },
  notificationsBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationsBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
});

export default Home;
