import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, StyleSheet, Image } from "react-native";
import {
  Home,
  Heart,
  MessageCircle,
  MessageSquareText,
  MessageSquareMore,
  Compass,
  User,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

import HomeScreen from "./(root)/(tab)/home";
import DiscoverScreen from "./(root)/(tab)/discover";
import ChatScreen from "./(root)/(tab)/chats";
import ProfileScreen from "./(root)/(tab)/profile";
import MatchesScreen from "./(root)/(tab)/matches";
import { images } from "../constant/images";

// ✅ TabIcon Component
const TabIcon = ({ focused, Icon, customImage }) => {
  return focused ? (
    <View style={styles.gradientIcon}>
      {customImage ? (
        <Image source={customImage} style={styles.iconImageWhite} />
      ) : (
        <Icon size={28} color="#FF0066" />
      )}
    </View>
  ) : (
    <View style={styles.iconContainer}>
      {customImage ? (
        <Image source={customImage} style={styles.iconImageGray} />
      ) : (
        <Icon size={26} color="#8E8E8E" />
      )}
    </View>
  );
};


const Tab = createBottomTabNavigator();

const RootTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarShowLabel: false,
        tabBarStyle: {
          height: 90,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          paddingTop: 10,

        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} customImage={images.bondifyIcon} />
          ),
          
        }}
      />

      <Tab.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} Icon={Compass} />
          ),
        }}
      />

      <Tab.Screen
        name="Matches"
        component={MatchesScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} Icon={Heart} />
          ),
        }}
      />

      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} Icon={MessageSquareText} />
          ),
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} Icon={User} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default RootTabs;

const styles = StyleSheet.create({
  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
    height: 50,
    width: 50,
  },
  gradientIcon: {
    justifyContent: "center",
    alignItems: "center",
    height: 45,
    width: 45,
    borderRadius: 25,
  },
  iconImageWhite: {
    width: 27,
    height: 27,
    tintColor: "#FF0066",
    resizeMode: "contain",
  },
  iconImageGray: {
    width: 24,
    height: 24,
    tintColor: "#8E8E8E",
    resizeMode: "contain",
  },
});
