// import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
// import { Image as ExpoImage } from "expo-image";
// import { useEffect, useState } from "react";
// import { Image, Platform, StyleSheet, Text, View } from "react-native";
// import { useSelector } from "react-redux";

// import IceBreakerModal from "../components/modals/IceBreakerModal";
// import { colors } from "../constant/colors";
// import { Icons } from "../constant/icons";
// import { images } from "../constant/images";
// import { profileService } from "../services/profileService";
// import ChatScreen from "./(root)/(tab)/chats";
// import FeedScreen from "./(root)/(tab)/feed";
// import HomeScreen from "./(root)/(tab)/home";
// import MatchesScreen from "./(root)/(tab)/matches";
// import ProfileScreen from "./(root)/(tab)/profile";

// const Tab = createBottomTabNavigator();

// // ─── Helpers ──────────────────────────────────────────────────────────────────

// /** Resolve profile image URL from any shape the backend might return */
// const resolveProfileImage = (profile) => {
//   if (!profile) return null;
//   const candidate =
//     profile?.images?.[0]?.url  ||
//     profile?.images?.[0]       ||
//     profile?.profilePhoto      ||
//     profile?.profileImage      ||
//     profile?.avatar            ||
//     profile?.photo             ||
//     null;
//   return typeof candidate === 'string' ? candidate : null;
// };

// // ─── Tab Icon ─────────────────────────────────────────────────────────────────

// const TabIcon = ({ focused, customImage, badge }) => (
//   <View style={styles.tabIconContainer}>
//     <Image
//       source={customImage}
//       style={[
//         styles.iconImage,
//         focused ? styles.activeIconImage : styles.inactiveIconImage,
//       ]}
//     />
//     {badge > 0 && (
//       <View style={styles.notificationBadge}>
//         <Text style={styles.badgeText}>{badge > 99 ? "99+" : badge}</Text>
//       </View>
//     )}
//   </View>
// );

// // ─── Profile Tab Icon ─────────────────────────────────────────────────────────

// const ProfileTabIcon = ({ focused, profileImage }) => (
//   <View style={[styles.profileTabContainer, focused && styles.profileTabFocused]}>
//     {profileImage ? (
//       <ExpoImage
//         source={{ uri: profileImage }}
//         style={styles.profileTabImage}
//         cachePolicy="memory-disk"
//         placeholder={{ color: "#E5E7EB" }}
//         transition={200}
//       />
//     ) : (
//       <View style={styles.profileTabPlaceholder}>
//         <Image
//           source={Icons.people}
//           style={[
//             styles.iconImage,
//             focused ? styles.activeIconImage : styles.inactiveIconImage,
//           ]}
//         />
//       </View>
//     )}
//   </View>
// );

// // ─── Root Tabs ────────────────────────────────────────────────────────────────

// const RootTabs = () => {
//   const [showIceBreakerModal, setShowIceBreakerModal] = useState(false);
//   const [unreadMessages, setUnreadMessages]           = useState(0);
//   const [newLikes, setNewLikes]                       = useState(0);
//   const [profileImage, setProfileImage]               = useState(null);

//   const currentUserId = useSelector(
//     (state) => state.auth?.user?.id || state.auth?.user?._id
//   );

//   // ── Fetch profile image via profileService ────────────────────────────────
//   // getMyProfile() uses its own in-memory + AsyncStorage cache so this is
//   // essentially free after the first call anywhere in the app.
//   useEffect(() => {
//     const fetchProfileImage = async () => {
//       try {
//         // Uses cache first (no network hit if already fetched elsewhere)
//         const profile = await profileService.getMyProfile();
//         const img = resolveProfileImage(profile);
//         if (img) setProfileImage(img);
//       } catch (err) {
//         console.warn("[RootTabs] Could not fetch profile image:", err);
//       }
//     };

//     fetchProfileImage();
//   }, []);

//   // ── Re-fetch when user navigates back to any tab (profile might have updated) ──
//   // We use a focus listener pattern by listening to currentUserId changes,
//   // which triggers on login/switch. For photo updates, the socket handles it.
//   useEffect(() => {
//     if (!currentUserId) return;
//     const refetch = async () => {
//       try {
//         // force: true so we always get fresh image after a user switch
//         const profile = await profileService.getMyProfile({ force: true });
//         const img = resolveProfileImage(profile);
//         if (img) setProfileImage(img);
//       } catch (err) {
//         console.warn("[RootTabs] Profile refetch failed:", err);
//       }
//     };
//     refetch();
//   }, [currentUserId]);

//   // ── Badges + socket ───────────────────────────────────────────────────────
//   useEffect(() => {
//     const initialize = async () => {
//       try {
//         const [matchesResult, likesResult] = await Promise.allSettled([
//           (async () => {
//             const { matchService } = require("../services/matchService");
//             const matches = await matchService.getCachedMatches();
//             return matches.reduce((sum, m) => sum + (m.unread || 0), 0);
//           })(),
//           profileService.getLikedYou().catch(() => []),
//         ]);

//         if (matchesResult.status === 'fulfilled') {
//           setUnreadMessages(matchesResult.value);
//         }
//         if (likesResult.status === 'fulfilled') {
//           setNewLikes(Array.isArray(likesResult.value) ? likesResult.value.length : 0);
//         }
//       } catch (err) {
//         console.warn("[RootTabs] Badge init failed:", err);
//       }
//     };

//     initialize();
//   }, []);

//   // ── Socket listeners ──────────────────────────────────────────────────────
//   useEffect(() => {
//     const { socketService } = require("../services/socketService");

//     socketService.on("message:new", (data) => {
//       if (data?.from !== currentUserId) {
//         setUnreadMessages((prev) => prev + 1);
//       }
//     });

//     socketService.on("match:new", () => {
//       setNewLikes((prev) => prev + 1);
//     });

//     // When profile photo is updated elsewhere in the app, refresh the tab icon
//     socketService.on("profile:updated", async () => {
//       try {
//         const profile = await profileService.getMyProfile({ force: true });
//         const img = resolveProfileImage(profile);
//         if (img) setProfileImage(img);
//       } catch {
//         // silent — icon just keeps old image
//       }
//     });

//     return () => {
//       socketService.off("message:new");
//       socketService.off("match:new");
//       socketService.off("profile:updated");
//     };
//   }, [currentUserId]);

//   // ─────────────────────────────────────────────────────────────────────────

//   return (
//     <View style={styles.container}>
//       <Tab.Navigator
//         screenOptions={{
//           headerShown:     false,
//           tabBarShowLabel: false,
//           tabBarStyle:     styles.tabBar,
//         }}
//       >
//         <Tab.Screen
//           name="Home"
//           component={HomeScreen}
//           options={{
//             tabBarIcon: ({ focused }) => (
//               <TabIcon focused={focused} customImage={images.bondifyIcon} />
//             ),
//           }}
//         />

//         <Tab.Screen
//           name="Likes"
//           component={MatchesScreen}
//           options={{
//             tabBarIcon: ({ focused }) => (
//               <TabIcon focused={focused} customImage={Icons.heart} badge={newLikes} />
//             ),
//           }}
//         />

//         <Tab.Screen
//           name="Feed"
//           component={FeedScreen}
//           options={{
//             tabBarIcon: ({ focused }) => (
//               <TabIcon focused={focused} customImage={Icons.feedIcon} />
//             ),
//           }}
//         />

//         <Tab.Screen
//           name="Chat"
//           component={ChatScreen}
//           options={{
//             tabBarIcon: ({ focused }) => (
//               <TabIcon focused={focused} customImage={Icons.message} badge={unreadMessages} />
//             ),
//           }}
//         />

//         <Tab.Screen
//           name="Profile"
//           component={ProfileScreen}
//           options={{
//             tabBarIcon: ({ focused }) => (
//               <ProfileTabIcon focused={focused} profileImage={profileImage} />
//             ),
//           }}
//         />
//       </Tab.Navigator>

//       <IceBreakerModal
//         visible={showIceBreakerModal}
//         onClose={() => setShowIceBreakerModal(false)}
//       />
//     </View>
//   );
// };

// export default RootTabs;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#fff",
//   },
//   tabBar: {
//     height:          80,
//     backgroundColor: "#fff",
//     paddingTop:      10,
//     borderTopWidth:  1,
//     borderColor:     "#F1F5F9",
//     paddingBottom:   Platform.OS === "ios" ? 6 : 4,
//   },
//   tabIconContainer: {
//     alignItems:     "center",
//     justifyContent: "center",
//     borderRadius:   22,
//   },
//   iconImage: {
//     width:      28,
//     height:     28,
//     resizeMode: "contain",
//   },
//   activeIconImage: {
//     tintColor: colors.activePrimary,
//   },
//   inactiveIconImage: {
//     tintColor: colors.inactiveTab,
//   },
//   notificationBadge: {
//     position:          "absolute",
//     top:               -5,
//     right:             -8,
//     backgroundColor:   "#EF4444",
//     borderRadius:      10,
//     minWidth:          20,
//     height:            20,
//     justifyContent:    "center",
//     alignItems:        "center",
//     paddingHorizontal: 5,
//     borderWidth:       2,
//     borderColor:       "#fff",
//   },
//   badgeText: {
//     color:      "#fff",
//     fontSize:   11,
//     fontWeight: "bold",
//     textAlign:  "center",
//   },
//   profileTabContainer: {
//     width:          32,
//     height:         32,
//     borderRadius:   16,
//     alignItems:     "center",
//     justifyContent: "center",
//     overflow:       "hidden",
//   },
//   profileTabFocused: {
//     borderWidth: 2,
//     borderColor: colors.activePrimary,
//   },
//   profileTabImage: {
//     width:        28,
//     height:       28,
//     borderRadius: 14,
//   },
//   profileTabPlaceholder: {
//     width:           28,
//     height:          28,
//     borderRadius:    14,
//     alignItems:      "center",
//     justifyContent:  "center",
//     backgroundColor: "#F3F4F6",
//   },
// });

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useEffect, useState } from "react";
import { Image, Platform, StyleSheet, View } from "react-native";
import { useSelector } from "react-redux";

import IceBreakerModal from "../components/modals/IceBreakerModal";
import { colors } from "../constant/colors";
import { Icons } from "../constant/icons";
import { images } from "../constant/images";
import ChatScreen from "./(root)/(tab)/chats";
import HomeScreen from "./(root)/(tab)/home";
// import MapScreen from "./(root)/(tab)/map";
import FeedScreen from "./(root)/(tab)/feed";
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
        <View style={styles.notificationDot} />
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
    width: 25,
    height: 25,
    resizeMode: "contain",
  },
  activeIconImage: {
    tintColor: '#000',
  },
  inactiveIconImage: {
    tintColor: colors.inactiveTab,
  },
  notificationDot: {
    position: "absolute",
    top: -2,
    right: -4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#EF4444",
    borderWidth: 1.5,
    borderColor: "#fff",
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