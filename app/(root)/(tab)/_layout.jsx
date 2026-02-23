import { View, Image, Platform, StyleSheet, Pressable } from "react-native";
import React, { useState } from "react";
import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Bot, Send } from "lucide-react-native";
import { colors } from "../../../constant/colors";
import { Icons } from "../../../constant/icons";
import { images } from "../../../constant/images";
import IceBreakerModal from "../../../components/modals/IceBreakerModal";

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

const AIChatTabIcon = ({ focused }) => {
  return (
    <View
      style={[styles.tabIconContainer, focused && styles.activeTabContainer]}
    >
      <Bot size={24} color={focused ? colors.primary : "#fff"} />
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
              <TabIcon focused={focused} customImage={Icons.heart} />
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
    height: 80,
    backgroundColor: colors.primary,
    borderTopWidth: 0,
    elevation: 8,
    paddingBottom: Platform.OS === "ios" ? 20 : 10,
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