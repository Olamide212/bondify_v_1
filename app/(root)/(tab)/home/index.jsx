/**
 * Home.js
 *
 * White-screen fixes
 * ──────────────────
 * Problem 1 – blank flash on first mount:
 *   `showFullLoader` was `profilesLoading && !hasEverLoaded.current`.
 *   But `hasEverLoaded` flips true as soon as loading finishes once, so any
 *   subsequent fetch while the deck is empty produced `null` in the render
 *   tree → white screen.
 *
 * Problem 2 – blank flash on focus/AppState refresh:
 *   `refreshProfiles()` clears homeProfiles to [], then re-populates.
 *   During that window `hasProfiles` is false and `profilesLoading` is true,
 *   but the old guard only showed the loader on the very first load.
 *
 * Fix: Show LogoLoader whenever we have no renderable content AND any load
 * is in-flight, regardless of whether we've loaded before:
 *
 *   showFullLoader = profilesLoading && !hasProfiles
 *
 * This covers both first-mount AND subsequent refreshes where the deck
 * momentarily empties. Once we have profiles in hand we always render them
 * (stale-while-revalidate), so the card never disappears during background
 * refreshes when the deck is non-empty.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Bell, SlidersHorizontal, Zap } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AppState,
  Image,
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
import ActionTipsOverlay from "../../../../components/homeScreen/ActionTipsOverlay";
import AroundYou from "../../../../components/homeScreen/AroundYouTab";
import EmptyDeckSlider from "../../../../components/homeScreen/EmptyDeckSlider";
import AIAssistantModal from "../../../../components/modals/AIAssistantModal";
import BoostModal from "../../../../components/modals/BoostModal";
import CardFeedbackModal from "../../../../components/modals/CardFeedbackModal";
import ComplimentModal from "../../../../components/modals/ComplimentModal";
import FilterModal from "../../../../components/modals/FilterModal";
import NotificationsModal from "../../../../components/modals/NotificationsModal";
import UserProfileModal from "../../../../components/modals/UserProfileModal";
import LogoLoader from "../../../../components/ui/LogoLoader";
import { NotificationBanner } from "../../../../components/ui/NotificationBanner";
import { colors } from "../../../../constant/colors";
import { images } from "../../../../constant/images";
import { useProfile } from "../../../../context/ProfileContext";
import { profileService } from "../../../../services/profileService";
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

// ─────────────────────────────────────────────────────────────────────────────

const Home = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
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

  // ─── Derived deck state ───────────────────────────────────────────────────
  const hasProfiles    = Array.isArray(homeProfiles) && homeProfiles.length > 0;
  const currentProfile = hasProfiles
    ? homeProfiles[homeCurrentProfileIndex % homeProfiles.length]
    : null;

  // ─── hasEverLoaded: used only to decide empty-deck vs "still loading" ─────
  // We still track it so we never show EmptyDeckSlider before the first fetch
  // has completed (avoids false "no users" flash on cold start).
  const hasEverLoaded = useRef(false);
  useEffect(() => {
    if (!profilesLoading) hasEverLoaded.current = true;
  }, [profilesLoading]);

  // ─── Handle openNotifications param from navigation ───────────────────────
  useEffect(() => {
    if (params?.openNotifications === "true") {
      setShowNotificationsModal(true);
      // Clear the param to avoid re-opening on subsequent renders
      router.setParams({ openNotifications: undefined });
    }
  }, [params?.openNotifications, router]);

  // ─── Auto-refresh on tab focus ────────────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      refreshProfiles();
    }, [refreshProfiles])
  );

  // ─── Auto-refresh when app returns from background ────────────────────────
  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") refreshProfiles();
    });
    return () => sub.remove();
  }, [refreshProfiles]);

  // ─── UI state ─────────────────────────────────────────────────────────────
  const [swipeBadgeDirection,    setSwipeBadgeDirection]    = useState(null);
  const [showFilterModal,        setShowFilterModal]        = useState(false);
  const [showProfileModal,       setShowProfileModal]       = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showAIModal,            setShowAIModal]            = useState(false);
  const [showComplimentModal,    setShowComplimentModal]    = useState(false);
  const [showBoostModal,         setShowBoostModal]         = useState(false);
  const [selectedProfileId,      setSelectedProfileId]      = useState(null);
  const [isRefreshing,           setIsRefreshing]           = useState(false);
  const [notifications,          setNotifications]          = useState([]);
  const [isBoosting,             setIsBoosting]             = useState(false);

  // ─── First-time tips ──────────────────────────────────────────────────────
  const [showActionTips, setShowActionTips] = useState(false);
  useEffect(() => {
    ActionTipsOverlay.shouldShow().then((yes) => { if (yes) setShowActionTips(true); });
  }, []);

  // ─── Card feedback ────────────────────────────────────────────────────────
  const [feedbackAction, setFeedbackAction] = useState(null);
  const [showFeedback,   setShowFeedback]   = useState(false);

  const triggerFeedback = (action) => {
    setFeedbackAction(action);
    setShowFeedback(true);
  };

  const unreadNotificationsCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  // ─── Banner queue ─────────────────────────────────────────────────────────
  const [activeBanner,    setActiveBanner] = useState(null);
  const bannerQueueRef    = useRef([]);
  const bannerBusyRef     = useRef(false);
  const showNotifsModalRef = useRef(false);

  useEffect(() => {
    showNotifsModalRef.current = showNotificationsModal;
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
    if (showNotifsModalRef.current) return;
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
  useEffect(() => { notifSettingsRef.current = notifSettings; }, [notifSettings]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const cached = safeParse(await AsyncStorage.getItem(NOTIF_SETTINGS_STORAGE_KEY));
        if (mounted && cached) setNotifSettings((p) => ({ ...p, ...cached }));
      } catch {}
      try {
        const res = await SettingsService.getNotificationSettings();
        if (mounted && res?.data) {
          setNotifSettings((p) => ({ ...p, ...res.data }));
          await AsyncStorage.setItem(NOTIF_SETTINGS_STORAGE_KEY, JSON.stringify(res.data)).catch(() => {});
        }
      } catch {}
    };
    load();
    return () => { mounted = false; };
  }, []);

  // ─── Profile card entrance animation ─────────────────────────────────────
  const animation = useSharedValue(1);
  useEffect(() => {
    animation.value = 0;
    animation.value = withTiming(1, { duration: 600 });
  }, [homeCurrentProfileIndex, animation]);

  // ─── Swipe badge stamp ────────────────────────────────────────────────────
  const badgeOpacity = useSharedValue(0);
  const badgeScale   = useSharedValue(0.6);

  const showSwipeBadge = (direction) => {
    setSwipeBadgeDirection(direction);
    badgeScale.value   = 0.5;
    badgeOpacity.value = 0;
    badgeScale.value   = withTiming(1.08, { duration: 160 }, () => {
      badgeScale.value = withTiming(1, { duration: 100 });
    });
    badgeOpacity.value = withSequence(
      withTiming(1, { duration: 80  }),
      withTiming(1, { duration: 580 }),
      withTiming(0, { duration: 220 }, () => {
        runOnJS(setSwipeBadgeDirection)(null);
      })
    );
  };

  const badgeAnimStyle = useAnimatedStyle(() => ({
    opacity:   badgeOpacity.value,
    transform: [{ scale: badgeScale.value }],
  }));

  // ─── Swipe handlers ───────────────────────────────────────────────────────
  const handleSwipe = (direction) => {
    if (!currentProfile) return;
    showSwipeBadge(direction);
    handleHomeSwipe(direction, currentProfile);
    // Only show CardFeedbackModal for "nope" (pass) — for "like" the Bond badge stamp is sufficient
    // if (direction !== "right") {
    //   triggerFeedback("nope");
    // }
  };

  const handleComplimentPress = () => {
    if (!currentProfile) return;
    setShowComplimentModal(true);
  };

  const handleViewProfile = () => {
    if (!currentProfile) return;
    setSelectedProfileId(currentProfile._id || currentProfile.id);
    setShowProfileModal(true);
  };

  const handleBoostProfile = () => {
    setShowBoostModal(true);
  };

  const handleConfirmBoost = async () => {
    setIsBoosting(true);
    try {
      const result = await profileService.boostProfile();
      if (result.success) {
        setShowBoostModal(false);
        // Show success message
        enqueueBanner({
          id: `boost-success-${Date.now()}`,
          type: 'boost_success',
          title: 'Profile Boosted! ⚡',
          body: result.message,
        });
      }
    } catch (error) {
      console.error('Boost failed:', error);
      // Show error message
      enqueueBanner({
        id: `boost-error-${Date.now()}`,
        type: 'boost_error',
        title: 'Boost Failed',
        body: error.response?.data?.message || 'Unable to boost profile. Try again later.',
      });
    } finally {
      setIsBoosting(false);
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(animation.value, [0, 1], [60, 0]) },
      { scale:      interpolate(animation.value, [0, 1], [0.9, 1]) },
    ],
    opacity: animation.value,
  }));

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
            .map((n) => ({ ...n, read: Boolean(n?.read) }))
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
      prev.map((n) =>
        String(n.id) === String(notificationId) ? { ...n, read: true } : n
      )
    );
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  // ─── Socket listeners ─────────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    const mapPayload = (p = {}) => ({
      id:        p.id || `${p.type || "notif"}-${p.matchId || Date.now()}-${Math.random()}`,
      type:      p.type      || "notification",
      title:     p.title     || "Notification",
      body:      p.body      || "You have a new update.",
      createdAt: p.createdAt || new Date().toISOString(),
      matchId:   p.matchId,
      userId:    p.userId,
      read:      Boolean(p.read),
    });

    const pushNotification = (payload) => {
      const n = mapPayload(payload);
      setNotifications((prev) => {
        const existing = prev.find((x) => String(x.id) === String(n.id));
        const next = {
          ...n,
          read: n.read || Boolean(existing?.read) || showNotifsModalRef.current,
        };
        return [next, ...prev.filter((x) => String(x.id) !== String(next.id))].slice(0, MAX_NOTIFICATIONS);
      });
      enqueueBanner(n);
    };

    const handleNotificationNew = (p) => {
      if (!notifSettingsRef.current.pushNotifications) return;
      // Messages are handled in the chat tab only — do not add to the bell notifications
      if (p?.type === 'message') return;
      pushNotification(p);
    };
    const handleMatchNew = (p) => {
      if (!notifSettingsRef.current.pushNotifications || !notifSettingsRef.current.newMatch) return;
      pushNotification({
        ...p,
        type:  "match",
        title: p?.matchedUser?.name || p?.profile?.name || "New Match!",
        body:  "You have a new match 🎉",
      });
    };

    const handleProfileVisit = (p) => {
      if (!notifSettingsRef.current.pushNotifications) return;
      pushNotification({
        ...p,
        id:    `profile-visit-${p.userId}-${Math.random().toString(36).slice(2)}`,
        type:  'profile_visit',
        title: p?.userName || p?.title || 'Profile Visit',
        body:  p?.body || 'Someone visited your profile',
      });
    };

    const connectSocket = async () => {
      const socket = await socketService.connect();
      if (!socket || !isMounted) return;
      socketService.on("notification:new", handleNotificationNew);
      socketService.on("match:new",        handleMatchNew);
      socketService.on("profile:visited",  handleProfileVisit);
    };
    connectSocket();

    return () => {
      isMounted = false;
      socketService.off("notification:new", handleNotificationNew);
      socketService.off("match:new",        handleMatchNew);
      socketService.off("profile:visited",  handleProfileVisit);
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
    if ((notification.type === "match" || notification.type === "message" || notification.type === "profile_visit") && notification.userId) {
      setSelectedProfileId(notification.userId);
      setShowProfileModal(true);
    }
  };

  // ─── New notification handlers for redesigned modal ───────────────────────
  const handleBoost = () => {
    setShowNotificationsModal(false);
    // Navigate to boost/premium screen if available
    router.push("/premium");
  };

  const handleJoinEvent = (notification) => {
    if (!notification) return;
    markNotificationAsRead(notification.id);
    setShowNotificationsModal(false);
    // Navigate to the event or bondup
    if (notification.data?.eventId) {
      router.push({
        pathname: "/bondup-chat",
        params: { bondupId: notification.data.eventId },
      });
    }
  };

  const handleDeclineEvent = (notification) => {
    if (!notification) return;
    markNotificationAsRead(notification.id);
    // Could call an API to decline the event invitation
  };

  const handleViewTip = (notification) => {
    if (!notification) return;
    markNotificationAsRead(notification.id);
    setShowNotificationsModal(false);
    // Open AI assistant modal with the tip
    setShowAIModal(true);
  };

  const handleOpenSettings = () => {
    setShowNotificationsModal(false);
    router.push("/notification-settings");
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    refreshProfiles();
  };

  // ─── Render guards ────────────────────────────────────────────────────────
  //
  // KEY FIX: Show LogoLoader any time we have NO profiles AND loading is true.
  // This covers:
  //   (a) Cold start — first ever fetch
  //   (b) Re-fetch after deck empties (focus / AppState / EmptyDeckSlider CTA)
  //
  // When we DO have profiles, we always render them immediately (stale-while-
  // revalidate) — the pull-to-refresh spinner handles background re-fetches.
  //
  // Empty-deck only shows when loading is fully done AND there are genuinely
  // KEY FIX: Show LogoLoader only on true cold-start (never loaded AND loading).
  // Once we've loaded at least once, if there are no profiles we show EmptyDeckSlider
  // immediately — even if a background refresh is in flight. The pull-to-refresh
  // spinner on EmptyDeckSlider handles the "looking…" feedback.
  const showFullLoader = profilesLoading && !hasProfiles && !hasEverLoaded.current;
  const showEmptyDeck  = !profilesLoading && hasEverLoaded.current && !hasProfiles;

  if (showFullLoader) {
    return <LogoLoader color={colors.primary} />;
  }

  return (
    <View style={styles.container}>
      {/* ── In-app notification banner ── */}
      <NotificationBanner
        notification={activeBanner}
        onDismiss={advanceBannerQueue}
        onPress={handleBannerPress}
      />

      {/* ── Header ── */}
      <View style={styles.headerWrapper}>
        <View className="flex-row justify-between items-center ">
          {/* Left: Boost Icon */}
          <Pressable onPress={handleBoostProfile} disabled={isBoosting}>
            <View className="justify-center items-center rounded-full bg-background p-2">
              <Zap size={22} color={isBoosting ? '#ccc' : '#000'} />
            </View>
          </Pressable>

          {/* Center: Bondies Icon */}
          <View className="justify-center items-center">
            <Image source={images.bondiesMainicon} style={styles.centerLogo} />
          </View>

          {/* Right: Bell and Filter Icons */}
          <View className="flex-row gap-4">
            <Pressable onPress={handleOpenNotifications}>
              <View className="justify-center items-center rounded-full ">
                <Bell size={22} color='#000' />
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
              <View className="justify-center items-center rounded-full ">
                <SlidersHorizontal size={22} color='#000' />
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
          // ── Stale-while-revalidate: always show the card we have ────────
          <Animated.View style={[animatedStyle, { flex: 1 }]}>
            <AroundYou
              profile={currentProfile}
              onViewProfile={handleViewProfile}
            />
          </Animated.View>
        ) : showEmptyDeck ? (
          // ── Deck genuinely empty after load finished ─────────────────────
          <EmptyDeckSlider
            onRefresh={(km) => {
              setHomeFilters((prev) => ({ ...prev, maxDistance: km }));
              refreshProfiles();
            }}
            loading={isRefreshing || profilesLoading}
            currentDistance={homeFilters?.maxDistance ?? 50}
          />
        ) : profilesLoading ? (
          // ── Loading state (not first load) — show inline loader ──────────
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <LogoLoader color={colors.primary} />
          </View>
        ) : null}
      </ScrollView>

      {hasProfiles && currentProfile && (
        <View style={styles.actionButtonWrapper}>
          <ActionButtons
            onSwipe={handleSwipe}
            onCompliment={handleComplimentPress}
            Redo={true}
          />
        </View>
      )}

      {/* ── Action tips (first-time) ── */}
      {showActionTips && (
        <ActionTipsOverlay onDismiss={() => setShowActionTips(false)} />
      )}

      {/* ── Card feedback ── */}
      <CardFeedbackModal
        visible={showFeedback}
        action={feedbackAction}
        onDone={() => { setShowFeedback(false); setFeedbackAction(null); }}
      />

      {/* ── Modals ── */}
      <ComplimentModal
        visible={showComplimentModal}
        onClose={() => setShowComplimentModal(false)}
        targetUser={currentProfile}
        currentUser={currentUser}
        onSent={() => triggerFeedback("compliment")}
        onViewNextProfile={() => {
          setShowComplimentModal(false);
          handleSwipe("right");
        }}
      />

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
        onBoost={handleBoost}
        onJoinEvent={handleJoinEvent}
        onDeclineEvent={handleDeclineEvent}
        onViewTip={handleViewTip}
        onOpenSettings={handleOpenSettings}
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

      <BoostModal
        visible={showBoostModal}
        onClose={() => setShowBoostModal(false)}
        onBoost={handleConfirmBoost}
        isLoading={isBoosting}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  headerWrapper: {
    position: "absolute",
    top:      50,
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

  swipeBadge:      { position: "absolute", width: 200, height: 100, zIndex: 200 },
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
  centerLogo: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
});

export default Home;