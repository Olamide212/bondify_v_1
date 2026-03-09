import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useState } from "react";
import { Image, Platform, StyleSheet, View } from "react-native";

import IceBreakerModal from "../components/modals/IceBreakerModal";
import { colors } from "../constant/colors";
import { Icons } from "../constant/icons";
import { images } from "../constant/images";
import ChatScreen from "./(root)/(tab)/chats";
import AIChatScreen from "./(root)/(tab)/discover";
import HomeScreen from "./(root)/(tab)/home";
import MatchesScreen from "./(root)/(tab)/matches";
import ProfileScreen from "./(root)/(tab)/profile";
import MapScreen from "./(root)/(tab)/map"

const Tab = createBottomTabNavigator();

// Custom Icon Component without label
const TabIcon = ({ focused, customImage }) => {
  return (
    <View style={styles.tabIconContainer}>
      <Image
        source={customImage}
        style={[
          styles.iconImage,
          focused ? styles.activeIconImage : styles.inactiveIconImage,
        ]}
      />
    </View>
  );
};

const RootTabs = () => {
  const [showIceBreakerModal, setShowIceBreakerModal] = useState(false);

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
              <TabIcon focused={focused} customImage={Icons.heart} />
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
              <TabIcon focused={focused} customImage={Icons.message} />
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
