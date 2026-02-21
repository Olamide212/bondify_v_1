import { View, Image, Platform, StyleSheet } from "react-native";
import React from "react";
import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { colors } from "../../../constant/colors";
import { Icons } from "../../../constant/icons";
import { images } from "../../../constant/images";

const TabIcon = ({ focused, customImage }) => {
  return (
    <View
      style={[styles.tabIconContainer, focused && styles.activeTabContainer]}
    >
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

export default function TabsLayout() {
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
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} customImage={Icons.compass} />
            ),
          }}
        />
        <Tabs.Screen
          name="matches"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} customImage={Icons.heart} />
            ),
          }}
        />
        <Tabs.Screen
          name="chats"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} customImage={Icons.message} />
            ),
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
        <Tabs.Screen
          name="community"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    bottom: 30,
    left: 20,
    right: 20,
    height: 65,
    borderRadius: 100,
    backgroundColor: colors.primary,
    borderTopWidth: 0,
    marginHorizontal: 10,
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
    marginTop: 25,
  },
  activeTabContainer: {
    backgroundColor: colors.secondary,
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