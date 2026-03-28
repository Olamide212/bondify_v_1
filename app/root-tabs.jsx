import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Image as ExpoImage } from "expo-image";
import { useEffect, useState } from "react";
import { Image, Platform, StyleSheet, Text, View } from "react-native";
import { useSelector } from "react-redux";

import IceBreakerModal from "../components/modals/IceBreakerModal";
import { colors } from "../constant/colors";
import { Icons } from "../constant/icons";
import { images } from "../constant/images";
import ChatScreen from "./(root)/(tab)/chats";
import HomeScreen from "./(root)/(tab)/home";
import FeedScreen from "./(root)/(tab)/feed";
import MatchesScreen from "./(root)/(tab)/matches";
import ProfileScreen from "./(root)/(tab)/profile";

const Tab = createBottomTabNavigator();

// ─── Tab Icon ─────────────────────────────────────────────────────────────────

const TabIcon = ({ focused, customImage, badge }) => (
  <View style={styles.tabIconContainer}>
    <Image
      source={customImage}
      style={[
        styles.iconImage,
        focused ? styles.activeIconImage : styles.inactiveIconImage,
      ]}
    />
    {badge > 0 && (
      <View style={styles.notificationBadge}>
        <Text style={styles.badgeText}>{badge > 99 ? "99+" : badge}</Text>
      </View>
    )}
  </View>
);

// ─── Profile Tab Icon ─────────────────────────────────────────────────────────

const ProfileTabIcon = ({ focused, profileImage }) => (
  <View style={[styles.profileTabContainer, focused && styles.profileTabFocused]}>
    {profileImage ? (
      <ExpoImage
        source={{ uri: profileImage }}
        style={styles.profileTabImage}
        cachePolicy="memory-disk"
        placeholder={{ color: "#E5E7EB" }}
        transition={200}
      />
    ) : (
      // Placeholder ring with person icon while image loads
      <View style={styles.profileTabPlaceholder}>
        <Image
          source={Icons.people}
          style={[
            styles.iconImage,
            focused ? styles.activeIconImage : styles.inactiveIconImage,
          ]}
        />
      </View>
    )}
  </View>
);

// ─── Root Tabs ────────────────────────────────────────────────────────────────

const RootTabs = () => {
  const [showIceBreakerModal, setShowIceBreakerModal] = useState(false);
  const [unreadMessages, setUnreadMessages]           = useState(0);
  const [newLikes, setNewLikes]                       = useState(0);
  const [profileImage, setProfileImage]               = useState(null);

  // ── Try to get image immediately from Redux (zero delay) ─────────────────
  const reduxUser = useSelector((state) => state.auth?.user);
  const reduxProfileImage = useSelector((state) => {
    const user = state.auth?.user;
    // Check every common shape your backend might store the image in
    return (
      user?.images?.[0]?.url    ||
      user?.images?.[0]         ||
      user?.profilePhoto        ||
      user?.profileImage        ||
      user?.avatar              ||
      user?.photo               ||
      null
    );
  });

  const currentUserId = reduxUser?.id || reduxUser?._id;

  // Seed from Redux immediately — no wait
  useEffect(() => {
    if (reduxProfileImage && typeof reduxProfileImage === 'string') {
      setProfileImage(reduxProfileImage);
    }
  }, [reduxProfileImage]);

  // ── Then fetch fresh profile in background ────────────────────────────────
  useEffect(() => {
    const initialize = async () => {
      try {
        const { profileService } = require("../services/profileService");

        // Fetch profile — don't await sequentially, run what we can
        const [profile, likedYou] = await Promise.allSettled([
          profileService.getMyProfile(),
          profileService.getLikedYou().catch(() => []),
        ]);

        // Profile image — try every possible field shape
        if (profile.status === 'fulfilled' && profile.value) {
          const p = profile.value;
          const img =
            p?.images?.[0]?.url  ||
            p?.images?.[0]       ||
            p?.profilePhoto      ||
            p?.profileImage      ||
            p?.avatar            ||
            p?.photo             ||
            null;

          if (img && typeof img === 'string') {
            setProfileImage(img);
          }
        }

        // Likes badge
        if (likedYou.status === 'fulfilled') {
          setNewLikes(Array.isArray(likedYou.value) ? likedYou.value.length : 0);
        }

        // Unread messages
        const { matchService } = require("../services/matchService");
        const matches = await matchService.getCachedMatches().catch(() => []);
        const unreadCount = matches.reduce((sum, m) => sum + (m.unread || 0), 0);
        setUnreadMessages(unreadCount);

      } catch (err) {
        console.warn("[RootTabs] Failed to initialize:", err);
      }
    };

    initialize();
  }, []);

  // ── Socket listeners ──────────────────────────────────────────────────────
  useEffect(() => {
    const { socketService } = require("../services/socketService");

    socketService.on("message:new", (data) => {
      if (data?.from !== currentUserId) {
        setUnreadMessages((prev) => prev + 1);
      }
    });

    socketService.on("match:new", () => {
      setNewLikes((prev) => prev + 1);
    });

    // If your socket emits profile updates (e.g. after photo upload)
    socketService.on("profile:updated", (data) => {
      const img =
        data?.images?.[0]?.url ||
        data?.images?.[0]      ||
        data?.profilePhoto     ||
        null;
      if (img && typeof img === 'string') {
        setProfileImage(img);
      }
    });

    return () => {
      socketService.off("message:new");
      socketService.off("match:new");
      socketService.off("profile:updated");
    };
  }, [currentUserId]);

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <Tab.Navigator
        screenOptions={{
          headerShown:      false,
          tabBarShowLabel:  false,
          tabBarStyle:      styles.tabBar,
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} customImage={images.bondifyIcon} />
            ),
          }}
        />

        <Tab.Screen
          name="Likes"
          component={MatchesScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} customImage={Icons.heart} badge={newLikes} />
            ),
          }}
        />

        <Tab.Screen
          name="Feed"
          component={FeedScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} customImage={Icons.feedIcon} />
            ),
          }}
        />

        <Tab.Screen
          name="Chat"
          component={ChatScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} customImage={Icons.message} badge={unreadMessages} />
            ),
          }}
        />

        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <ProfileTabIcon focused={focused} profileImage={profileImage} />
            ),
          }}
        />
      </Tab.Navigator>

      <IceBreakerModal
        visible={showIceBreakerModal}
        onClose={() => setShowIceBreakerModal(false)}
      />
    </View>
  );
};

export default RootTabs;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  tabBar: {
    height:           80,
    backgroundColor:  "#fff",
    paddingTop:       10,
    borderTopWidth:   1,
    borderColor:      "#F1F5F9",
    paddingBottom:    Platform.OS === "ios" ? 6 : 4,
  },
  tabIconContainer: {
    alignItems:     "center",
    justifyContent: "center",
    borderRadius:   22,
  },
  iconImage: {
    width:      28,
    height:     28,
    resizeMode: "contain",
  },
  activeIconImage: {
    tintColor: colors.activePrimary,
  },
  inactiveIconImage: {
    tintColor: colors.inactiveTab,
  },
  notificationBadge: {
    position:        "absolute",
    top:             -5,
    right:           -8,
    backgroundColor: "#EF4444",
    borderRadius:    10,
    minWidth:        20,
    height:          20,
    justifyContent:  "center",
    alignItems:      "center",
    paddingHorizontal: 5,
    borderWidth:     2,
    borderColor:     "#fff",
  },
  badgeText: {
    color:      "#fff",
    fontSize:   11,
    fontWeight: "bold",
    textAlign:  "center",
  },

  // Profile tab
  profileTabContainer: {
    width:          32,
    height:         32,
    borderRadius:   16,
    alignItems:     "center",
    justifyContent: "center",
    overflow:       "hidden",
  },
  profileTabFocused: {
    borderWidth: 2,
    borderColor: colors.activePrimary,
  },
  profileTabImage: {
    width:        28,
    height:       28,
    borderRadius: 14,
  },
  profileTabPlaceholder: {
    width:          28,
    height:         28,
    borderRadius:   14,
    alignItems:     "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
  },
});