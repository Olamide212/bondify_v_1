import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Bot, LayoutGrid, Send } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSelector } from "react-redux";
import IceBreakerModal from "../../../components/modals/IceBreakerModal";
import { colors } from "../../../constant/colors";
import { Icons } from "../../../constant/icons";
import { images } from "../../../constant/images";

const TabIcon = ({ focused, customImage, badge }) => {
  return (
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
};

const AIChatTabIcon = ({ focused }) => {
  return (
    <View style={styles.tabIconContainer}>
      <Bot size={24} color={focused ? colors.activePrimary : colors.inactiveTab} />
    </View>
  );
};

const FeedTabIcon = ({ focused }) => {
  return (
    <View style={styles.tabIconContainer}>
      <LayoutGrid size={24} color={focused ? colors.activePrimary : colors.inactiveTab} />
    </View>
  );
};

const CenterIceBreakerButton = ({ onPress }) => {
  return (
    <Pressable style={styles.centerButtonWrapper} onPress={onPress}>
      <View style={styles.centerButton}>
        <Send size={26} color="#fff" />
      </View>
    </Pressable>
  );
};

export default function TabsLayout() {
  const [showIceBreakerModal, setShowIceBreakerModal] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [newLikes, setNewLikes] = useState(0);

  // Get current user from Redux auth
  const currentUserId = useSelector((state) => state.auth?.user?.id || state.auth?.user?._id);

  // Listen for socket events to update badge counts
  useEffect(() => {
    const initializeBadges = async () => {
      try {
        const { matchService } = require("../../../services/matchService");
        const matches = await matchService.getCachedMatches();
        const unreadCount = matches.reduce((sum, match) => sum + (match.unread || 0), 0);
        setUnreadMessages(unreadCount);

        const { profileService } = require("../../../services/profileService");
        const likedYou = await profileService.getLikedYou().catch(() => []);
        setNewLikes(likedYou.length);
      } catch (err) {
        console.warn("Failed to initialize badge counts:", err);
      }
    };

    initializeBadges();

    const { socketService } = require("../../../services/socketService");

    socketService.on("message:new", (data) => {
      if (data?.from !== currentUserId) {
        setUnreadMessages(prev => prev + 1);
      }
    });

    socketService.on("match:new", () => {
      setNewLikes(prev => prev + 1);
    });

    return () => {
      socketService.off("message:new");
      socketService.off("match:new");
    };
  }, [currentUserId]);

  return (
    <View className="bg-app flex-1">
      <StatusBar style="" />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: styles.tabBar,
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} customImage={images.bondifyIcon} />
            ),
          }}
        />
        <Tabs.Screen
          name="discover"
          options={{
            title: "AI Chat",
            tabBarIcon: ({ focused }) => <AIChatTabIcon focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="matches"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} customImage={Icons.heart} badge={newLikes} />
            ),
            tabBarButton: (props) => (
              <CenterIceBreakerButton
                onPress={() => setShowIceBreakerModal(true)}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="chats"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} customImage={Icons.message} badge={unreadMessages} />
            ),
          }}
        />
        <Tabs.Screen
          name="feed"
          options={{
            title: "BonFeed",
            tabBarIcon: ({ focused }) => <FeedTabIcon focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} customImage={Icons.people} />
            ),
          }}
        />
        {/* Map tab hidden — replaced by Feed
        <Tabs.Screen
          name="map"
          options={{ href: null }}
        /> */}
        <Tabs.Screen
          name="community"
          options={{ href: null }}
        />
      </Tabs>

      <IceBreakerModal
        visible={showIceBreakerModal}
        onClose={() => setShowIceBreakerModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 92,
    backgroundColor: "#fff",
    borderTopWidth: 0,
    elevation: 8,
    paddingBottom: Platform.OS === "ios" ? 0 : 6,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tabIconContainer: {
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    width: 44,
    borderRadius: 22,
  },
  iconImage: {
    width: 24,
    height: 24,
    resizeMode: "contain",
  },
  activeIconImage: {
    tintColor: colors.activePrimary,
  },
  inactiveIconImage: {
    tintColor: colors.inactiveTab,
  },
  notificationBadge: {
    position: "absolute",
    top: -5,
    right: -8,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: "#fff",
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
    textAlign: "center",
  },
  centerButtonWrapper: {
    top: -20,
    justifyContent: "center",
    alignItems: "center",
  },
  centerButton: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.secondary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 4,
    borderColor: colors.primary,
  },
});
