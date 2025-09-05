import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, StyleSheet, Image, Text } from "react-native";
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


// ✅ Custom Icon Component with label
const TabIcon = ({ focused, Icon, customImage, label }) => {
  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        width: 70, // enough width to prevent wrapping
      }}
    >
      {focused ? (
        <View style={styles.gradientIcon}>
          {customImage ? (
            <Image source={customImage} style={styles.iconImageWhite} />
          ) : (
            <Icon size={28} color={colors.primary} />
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
      )}
      <Text
        numberOfLines={1} // ✅ force one line
        ellipsizeMode="clip"
        style={{
          fontSize: 12,
          textAlign: "center",
          color: focused ? "#000" : "#8E8E8E",
          fontWeight: focused ? "600" : "400", // ✅ bold when active
        }}
      >
        {label}
      </Text>
    </View>
  );
};


const RootTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false, // we’re handling labels manually in TabIcon
        tabBarStyle: {
          height: 90,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          paddingTop: 10,
          backgroundColor: "#fff",
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              customImage={images.bondifyIcon}
              label="Home"
            />
          ),
        }}
      />

      <Tab.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} customImage={Icons.compass} label="Discover" />
          ),
        }}
      />

      <Tab.Screen
        name="Matches"
        component={MatchesScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} customImage={Icons.heart} label="Matches" />
          ),
        }}
      />

      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} customImage={Icons.message} label="Chat" />
          ),
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} customImage={Icons.people} label="Profile" />
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
    height: 35,
    width: 70,

  },
  gradientIcon: {
    justifyContent: "center",
    alignItems: "center",
    height: 35,
    width: 45,
    borderRadius: 25,
  },
  iconImageWhite: {
    width: 27,
    height: 27,
    tintColor: "#000",
    resizeMode: "contain",
  },
  iconImageGray: {
    width: 24,
    height: 24,
    tintColor: "#8E8E8E",
    resizeMode: "contain",
  },
});
