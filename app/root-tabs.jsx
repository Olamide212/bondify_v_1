import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useEffect, useState } from "react";
import { Image, Platform, StyleSheet, Text, View } from "react-native";
import { useSelector } from "react-redux";

import IceBreakerModal from "../components/modals/IceBreakerModal";
import { colors } from "../constant/colors";
import { Icons } from "../constant/icons";
import { images } from "../constant/images";
import ChatScreen from "./(root)/(tab)/chats";
import HomeScreen from "./(root)/(tab)/home";
import MapScreen from "./(root)/(tab)/map";
import MatchesScreen from "./(root)/(tab)/matches";
import ProfileScreen from "./(root)/(tab)/profile";

const Tab = createBottomTabNavigator();

// Custom Icon Component with optional notification badge
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

const RootTabs = () => {
  const [showIceBreakerModal, setShowIceBreakerModal] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [newLikes, setNewLikes] = useState(0);
  
  // Get current user from Redux auth
  const currentUserId = useSelector((state) => state.auth?.user?.id || state.auth?.user?._id);
  
  // Listen for socket events to update badge counts
  useEffect(() => {
    // Load initial counts from services
    const initializeBadges = async () => {
      try {
        // Get matches with unread count
        const { matchService } = require("../services/matchService");
        const matches = await matchService.getCachedMatches();
        const unreadCount = matches.reduce((sum, match) => sum + (match.unread || 0), 0);
        setUnreadMessages(unreadCount);
        
        // Get likes count (from likedYou data)
        const { profileService } = require("../services/profileService");
        const likedYou = await profileService.getLikedYou().catch(() => []);
        setNewLikes(likedYou.length);
      } catch (err) {
        console.warn("Failed to initialize badge counts:", err);
      }
    };
    
    initializeBadges();
    
    // Listen for socket events for real-time updates
    const { socketService } = require("../services/socketService");
    
    // Update on new message
    socketService.on("message:new", (data) => {
      if (data?.from !== currentUserId) {
        setUnreadMessages(prev => prev + 1);
      }
    });
    
    // Update on new like/match
    socketService.on("match:new", () => {
      setNewLikes(prev => prev + 1);
    });
    
    return () => {
      // Cleanup listeners
      socketService.off("message:new");
      socketService.off("match:new");
    };
  }, [currentUserId]);

  return (
    <View style={styles.container}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: styles.tabBar,
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
          name="Map"
          component={MapScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} customImage={Icons.mapIcon} />
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
              <TabIcon focused={focused} customImage={Icons.people} />
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
    height: 80,
    backgroundColor: "#fff",
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: "#F1F5F9",
    paddingBottom: Platform.OS === "ios" ? 6 : 4,
    // elevation: 8,
    // ...Platform.select({
    //   ios: {
    //     shadowColor: "#000",
    //     shadowOffset: { width: 0, height: -2 },
    //     shadowOpacity: 0.1,
    //     shadowRadius: 4,
    //   },
    //   android: {
    //     elevation: 8,
    //   },
    // }),
  },
  tabIconContainer: {
    alignItems: "center",
    justifyContent: "center",
    // height: 40,
    // width: 40,
    borderRadius: 22,
  },
  iconImage: {
    width: 28,
    height: 28,
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
    width: 70,
    height: 70,
    borderRadius: 50,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    // borderWidth: 4,
    // borderColor: colors.primary,
  },
});
