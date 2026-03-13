import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { Bell, SlidersHorizontal } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AppState,
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
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSelector } from "react-redux";
import ActionButtons from "../../../../components/homeScreen/ActionButtons";
import AroundYou from "../../../../components/homeScreen/AroundYouTab";
import EmptyDeckSlider from "../../../../components/homeScreen/EmptyDeckSlider";
import AIAssistantModal from "../../../../components/modals/AIAssistantModal";
import FilterModal from "../../../../components/modals/FilterModal";
import MatchCelebrationModal from "../../../../components/modals/MatchCelebrationModal";
import NotificationsModal from "../../../../components/modals/NotificationsModal";
import UserProfileModal from "../../../../components/modals/UserProfileModal";
import { NotificationBanner } from "../../../../components/ui/NotificationBanner";
import LogoLoader from "../../../../components/ui/LogoLoader";
import { colors } from "../../../../constant/colors";
import { useProfile } from "../../../../context/ProfileContext";
import { messageService } from "../../../../services/messageService";
import SettingsService from "../../../../services/settingsService";
import { socketService } from "../../../../services/socketService";

// ─── Swipe badge assets ───────────────────────────────────────────────────────
const BOND_BADGE = require("../../../../assets/images/Bond_Badge_Right.png");
const NOPE_BADGE = require("../../../../assets/images/Nope_Badge_Left.png");

const NOTIFICATIONS_STORAGE_KEY  = "@bondify/cache/home/notifications";
const NOTIF_SETTINGS_STORAGE_KEY = "@bondify/cache/notificationSettings";
const MAX_NOTIFICATIONS = 100;

const DEFAULT_NOTIF_SETTINGS = {
  newMatch:           true,
  newMessage:         true,
  newLike:            true,
  superLike:          true,
  eventReminder:      true,
  pushNotifications:  true,
  emailNotifications: true,
  marketingEmails:    false,
};

const safeParse = (value) => {
  try { return JSON.parse(value); }
  catch { return null; }
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

  // ─── hasEverLoaded: prevents false empty-state on initial mount ───────────
  // Flips to true once profilesLoading transitions false for the first time.
  // Without this, the screen flashes "No users" immediately on mount because
  // homeProfiles is [] while the first fetch is still in-flight.
  const hasEverLoaded = useRef(false);
  useEffect(() => {
    if (!profilesLoading) {
      hasEverLoaded.current = true;
    }
  }, [profilesLoading]);

  // ─── Auto-refresh on tab focus ────────────────────────────────────────────
  // Fires every time the Home tab gains focus (user navigates back to it).
  useFocusEffect(
    useCallback(() => {
      refreshProfiles();
    }, [refreshProfiles])
  );

  // ─── Auto-refresh when app returns from background ────────────────────────
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        refreshProfiles();
      }
    });
    return () => subscription.remove();
  }, [refreshProfiles]);

  // ─── Swipe badge ──────────────────────────────────────────────────────────
  const [swipeBadgeDirection, setSwipeBadgeDirection] = useState(null);
  const badgeOpacity = useSharedValue(0);
  const badgeScale   = useSharedValue(0.6);

  const [showFilterModal,        setShowFilterModal]        = useState(false);
  const [showProfileModal,       setShowProfileModal]       = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showAIModal,            setShowAIModal]            = useState(false);
  const [selectedProfileId,      setSelectedProfileId]      = useState(null);
  const [isRefreshing,           setIsRefreshing]           = useState(false);
  const [notifications,          setNotifications]          = useState([]);

  const unreadNotificationsCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications]
  );

  // ─── Banner queue ─────────────────────────────────────────────────────────
  const [activeBanner, setActiveBanner] = useState(null);
  const bannerQueueRef = useRef([]);
  const bannerBusyRef  = useRef(false);

  const showNotificationsModalRef = useRef(false);
  useEffect(() => {
    showNotificationsModalRef.current = showNotificationsModal;
  }, [showNotificationsModal]);

  const advanceBannerQueue = useCallback(() => {
    const next = bannerQueueRef.current.shift();
    if (next) {
      bannerBusyRef.current = true;
      setActiveBanner(next);
    } else {
      bannerBusyRef.current = false;
      setActiveBanner(null);
    }
  }, []);

  const enqueueBanner = useCallback((notification) => {
    if (showNotificationsModalRef.current) return;
    if (bannerBusyRef.current) {
      bannerQueueRef.current.push(notification);
    } else {
      bannerBusyRef.current = true;
      setActiveBanner(notification);
    }
  }, []);

  // ─── Notification settings ────────────────────────────────────────────────
  const [notifSettings, setNotifSettings] = useState(DEFAULT_NOTIF_SETTINGS);
  const notifSettingsRef = useRef(DEFAULT_NOTIF_SETTINGS);
  useEffect(() => {
    notifSettingsRef.current = notifSettings;
  }, [notifSettings]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const cached = safeParse(await AsyncStorage.getItem(NOTIF_SETTINGS_STORAGE_KEY));
        if (mounted && cached) setNotifSettings((prev) => ({ ...prev, ...cached }));
      } catch {}
      try {
        const res = await SettingsService.getNotificationSettings();
        if (mounted && res?.data) {
          setNotifSettings((prev) => ({ ...prev, ...res.data }));
          await AsyncStorage.setItem(NOTIF_SETTINGS_STORAGE_KEY, JSON.stringify(res.data)).catch(() => {});
        }
      } catch {}
    };
    load();
    return () => { mounted = false; };
  }, []);

  // ─── Profile card animation ───────────────────────────────────────────────
  const animation = useSharedValue(1);

  const hasProfiles  = Array.isArray(homeProfiles) && homeProfiles.length > 0;
  const currentProfile = hasProfiles
    ? homeProfiles[homeCurrentProfileIndex % homeProfiles.length]
    : null;

  useEffect(() => {
    animation.value = 0;
    animation.value = withTiming(1, { duration: 600 });
  }, [homeCurrentProfileIndex, animation]);

  // ─── Swipe badge stamp animation ─────────────────────────────────────────
  const showSwipeBadge = (direction) => {
    setSwipeBadgeDirection(direction);
    badgeScale.value   = 0.5;
    badgeOpacity.value = 0;

    badgeScale.value = withTiming(1.08, { duration: 160 }, () => {
      badgeScale.value = withTiming(1, { duration: 100 });
    });
    badgeOpacity.value = withSequence(
      withTiming(1,  { duration: 80  }),
      withTiming(1,  { duration: 580 }),
      withTiming(0,  { duration: 220 }, () => {
        runOnJS(setSwipeBadgeDirection)(null);
      })
    );
  };

  const badgeAnimStyle = useAnimatedStyle(() => ({
    opacity:   badgeOpacity.value,
    transform: [{ scale: badgeScale.value }],
  }));

  const handleSwipe = (direction) => {
    if (!currentProfile) return;
    showSwipeBadge(direction);
    handleHomeSwipe(direction, currentProfile);
  };

  const handleSuperLike = () => {
    if (!currentProfile) return;
    showSwipeBadge("right");
    handleHomeSuperLike(currentProfile);
  };

  const handleViewProfile = () => {
    if (currentProfile) {
      setSelectedProfileId(currentProfile._id || currentProfile.id);
      setShowProfileModal(true);
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(animation.value, [0, 1], [60, 0]);
    const scale      = interpolate(animation.value, [0, 1], [0.9, 1]);
    return { transform: [{ translateY }, { scale }], opacity: animation.value };
  });

  // Stop pull-to-refresh spinner once loading settles
  useEffect(() => {
    if (!profilesLoading && isRefreshing) setIsRefreshing(false);
  }, [profilesLoading, isRefreshing]);

  // ─── Notification cache ───────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY)
      .then((raw) => {
        const parsed = safeParse(raw);
        if (!isMounted || !Array.isArray(parsed)) return;
        setNotifications(
          parsed.filter(Boolean)
            .map((item) => ({ ...item, read: Boolean(item?.read) }))
            .slice(0, MAX_NOTIFICATIONS)
        );
      })
      .catch((e) => console.warn("Failed to hydrate notifications:", e?.message));
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(
      NOTIFICATIONS_STORAGE_KEY,
      JSON.stringify(notifications.slice(0, MAX_NOTIFICATIONS))
    ).catch((e) => console.warn("Failed to persist notifications:", e?.message));
  }, [notifications]);

  const markNotificationAsRead = useCallback((notificationId) => {
    if (!notificationId) return;
    setNotifications((prev) =>
      prev.map((item) =>
        String(item.id) === String(notificationId) ? { ...item, read: true } : item
      )
    );
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  }, []);

  // ─── Socket listeners ─────────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    const mapPayload = (payload = {}) => ({
      id:
        payload.id ||
        `${payload.type || "notification"}-${payload.matchId || Date.now()}-${Math.random()}`,
      type:      payload.type      || "notification",
      title:     payload.title     || "Notification",
      body:      payload.body      || "You have a new update.",
      createdAt: payload.createdAt || new Date().toISOString(),
      matchId:   payload.matchId,
      userId:    payload.userId,
      read:      Boolean(payload.read),
    });

    const pushNotification = (payload) => {
      const normalized = mapPayload(payload);
      setNotifications((prev) => {
        const existing = prev.find((item) => String(item.id) === String(normalized.id));
        const next = {
          ...normalized,
          read:
            normalized.read ||
            Boolean(existing?.read) ||
            showNotificationsModalRef.current,
        };
        const deduped = prev.filter((item) => String(item.id) !== String(next.id));
        return [next, ...deduped].slice(0, MAX_NOTIFICATIONS);
      });
      enqueueBanner(normalized);
    };

    const handleNotificationNew = (payload) => {
      if (!notifSettingsRef.current.pushNotifications) return;
      pushNotification(payload);
    };

    const handleMatchNew = (payload) => {
      if (!notifSettingsRef.current.pushNotifications) return;
      if (!notifSettingsRef.current.newMatch) return;
      pushNotification({
        ...payload,
        type:  "match",
        title: payload?.matchedUser?.name || payload?.profile?.name || "New Match!",
        body:  "You have a new match 🎉",
      });
    };

    const handleMessageNew = ({ matchId, message }) => {
      if (!message) return;
      if (!notifSettingsRef.current.pushNotifications) return;
      if (!notifSettingsRef.current.newMessage) return;

      const senderName =
        message.sender?.name ||
        [message.sender?.firstName, message.sender?.lastName].filter(Boolean).join(" ") ||
        "New message";

      const body =
        message.type === "image" ? "Sent you a photo"
        : message.type === "voice" ? "Sent you a voice note"
        : message.content || "Sent you a message";

      pushNotification({
        id: `${matchId || message._id || message.id}-${message._id || message.id || Date.now()}`,
        type:      "message",
        title:     senderName,
        body,
        createdAt: message.createdAt || new Date().toISOString(),
        matchId,
        userId:    message.sender?._id || message.sender?.id,
      });
    };

    const connectSocket = async () => {
      const socket = await socketService.connect();
      if (!socket || !isMounted) return;
      socketService.on("notification:new", handleNotificationNew);
      socketService.on("match:new",        handleMatchNew);
      socketService.on("message:new",      handleMessageNew);
    };

    connectSocket();

    return () => {
      isMounted = false;
      socketService.off("notification:new", handleNotificationNew);
      socketService.off("match:new",        handleMatchNew);
      socketService.off("message:new",      handleMessageNew);
    };
  }, [enqueueBanner]);

  const handleOpenNotifications = () => setShowNotificationsModal(true);

  const handlePressNotification = (notification) => {
    if (!notification) return;
    markNotificationAsRead(notification.id);
    if (notification.type === "match" && notification.userId) {
      setSelectedProfileId(notification.userId);
      setShowProfileModal(true);
    }
    setShowNotificationsModal(false);
  };

  const handleBannerPress = (notification) => {
    if (!notification) return;
    markNotificationAsRead(notification.id);
    if (
      (notification.type === "match" || notification.type === "message") &&
      notification.userId
    ) {
      setSelectedProfileId(notification.userId);
      setShowProfileModal(true);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    refreshProfiles();
  };

  // ─── Render guards ────────────────────────────────────────────────────────
  // Show full-screen loader only on the very first load (before we've ever
  // received data). After that we let the UI render stale data + spinner.
  const showFullLoader = profilesLoading && !hasEverLoaded.current;

  // Show empty-deck only once we know the first load finished with no profiles.
  const showEmptyDeck  = hasEverLoaded.current && !profilesLoading && !hasProfiles;

  if (showFullLoader) return <LogoLoader color={colors.primary} />;

  return (
    <View style={styles.container}>
      {/* ── In-app notification banner ── */}
      <NotificationBanner
        notification={activeBanner}
        onDismiss={advanceBannerQueue}
        onPress={handleBannerPress}
      />

      <View style={styles.headerWrapper}>
        <View className="flex-row justify-end gap-4">
          <View className="flex-row gap-2">
            {/* <Pressable onPress={handleOpenNotifications}>
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
            </Pressable> */}

            <Pressable onPress={() => setShowFilterModal(true)}>
              <View className="justify-center items-center rounded-full bg-background w-14 h-14">
                <SlidersHorizontal size={23} color={colors.primary} />
              </View>
            </Pressable>
          </View>
        </View>
      </View>

      {/* ── BOND / NOPE stamp badge ── */}
      {swipeBadgeDirection !== null && (
        <Animated.Image
          source={swipeBadgeDirection === "right" ? BOND_BADGE : NOPE_BADGE}
          style={[
            styles.swipeBadge,
            swipeBadgeDirection === "right" ? styles.swipeBadgeRight : styles.swipeBadgeLeft,
            badgeAnimStyle,
          ]}
          resizeMode="contain"
          pointerEvents="none"
        />
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
        ) : showEmptyDeck ? (
          // ── Animated multi-line slider shown when deck is genuinely empty ──
        <EmptyDeckSlider
  onRefresh={(km) => {
    setHomeFilters(prev => ({ ...prev, maxDistance: km }));
    refreshProfiles();
  }}
  loading={profilesLoading}
  currentDistance={homeFilters?.maxDistance ?? 50}
/>
        ) : null /* still loading first batch — full loader handles it above */}
      </ScrollView>

      {hasProfiles && currentProfile && (
        <View style={styles.actionButtonWrapper}>
          <ActionButtons
            onSwipe={handleSwipe}
            onSuperLike={handleSuperLike}
            Redo={true}
          />
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
        onClearAll={() => setNotifications([])}
        onPressNotification={handlePressNotification}
      />

      <UserProfileModal
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        profileId={selectedProfileId}
      />

      <AIAssistantModal
        visible={showAIModal}
        onClose={() => setShowAIModal(false)}
        fullScreen
      />

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
                type:    "text",
              });
            } catch (error) {
              console.error("Failed to send ice breaker:", error);
            }
          }
          setMatchCelebration(null);
        }}
        onContinueSwiping={() => setMatchCelebration(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  headerWrapper: {
    position: "absolute",
    top:      60,
    left:     20,
    right:    20,
    zIndex:   50,
  },
  actionButtonWrapper: {
    position: "absolute",
    bottom:   5,
    left:     0,
    right:    0,
    zIndex:   10,
  },

  // ── BOND / NOPE stamp badges ─────────────────────────────────────────────
  swipeBadge: {
    position: "absolute",
    width:    200,
    height:   100,
    zIndex:   200,
  },
  swipeBadgeRight: { top: "30%", left:  "5%" },
  swipeBadgeLeft:  { top: "30%", right: "5%" },

  aroundYouContainer: { flex: 1 },

  notificationsBadge: {
    position:          "absolute",
    top:               6,
    right:             6,
    minWidth:          18,
    height:            18,
    borderRadius:      9,
    paddingHorizontal: 4,
    backgroundColor:   colors.primary,
    alignItems:        "center",
    justifyContent:    "center",
  },
  notificationsBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
});

export default Home;