import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, StyleSheet, Image, Platform } from "react-native";
import {
  Home,
  Heart,
  MessageSquareText,
  Compass,
  User,
} from "lucide-react-native";

import HomeScreen from "./(root)/(tab)/home";
import DiscoverScreen from "./(root)/(tab)/discover";
import ChatScreen from "./(root)/(tab)/chats";
import ProfileScreen from "./(root)/(tab)/profile";
import MatchesScreen from "./(root)/(tab)/matches";
import { images } from "../constant/images";
import { Icons } from "../constant/icons";
import { colors } from "../constant/colors";

const Tab = createBottomTabNavigator();

// Custom Icon Component without label
const TabIcon = ({ focused, Icon, customImage }) => {
  return (
    <View
      style={[styles.tabIconContainer, focused && styles.activeTabContainer]}
    >
      {customImage ? (
        <Image
          source={customImage}
          style={[
            styles.iconImage,
            focused ? styles.activeIconImage : styles.inactiveIconImage,
          ]}
        />
      ) : (
        <Icon size={24} color={focused ? colors.white : colors.gray} />
      )}
    </View>
  );
};

const RootTabs = () => {
  return (
    <View style={styles.container}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false, // No labels
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
          name="Discover"
          component={DiscoverScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} customImage={Icons.compass} />
            ),
          }}
        />

        <Tab.Screen
          name="Matches"
          component={MatchesScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} customImage={Icons.heart} />
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
    position: "absolute",
    bottom: 30,
    left: 20,
    right: 20,
    height: 65,
    borderRadius: 100,
    backgroundColor: colors.primary,
    borderTopWidth: 0,
    marginHorizontal: 30,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tabIconContainer: {
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    width: 50,
    borderRadius: 25,
    marginTop: 25
  },
  activeTabContainer: {
    backgroundColor: colors.secondary, // Purple color
  },
  iconImage: {
    width: 24,
    height: 24,
    resizeMode: "contain",
  },
  activeIconImage: {
    tintColor: colors.primary,
  },
  inactiveIconImage: {
    tintColor: "#fff",
  },
});
