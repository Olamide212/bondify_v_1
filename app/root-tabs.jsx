import React, { useState } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, StyleSheet, Image, Platform, Pressable } from "react-native";
import { Bot, Send } from "lucide-react-native";

import HomeScreen from "./(root)/(tab)/home";
import AIChatScreen from "./(root)/(tab)/discover";
import ChatScreen from "./(root)/(tab)/chats";
import ProfileScreen from "./(root)/(tab)/profile";
import MatchesScreen from "./(root)/(tab)/matches";
import { images } from "../constant/images";
import { Icons } from "../constant/icons";
import { colors } from "../constant/colors";
import IceBreakerModal from "../components/modals/IceBreakerModal";

const Tab = createBottomTabNavigator();

// Custom Icon Component without label
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
          name="AI Chat"
          component={AIChatScreen}
          options={{
            tabBarIcon: ({ focused }) => <AIChatTabIcon focused={focused} />,
          }}
        />

        <Tab.Screen
          name="IceBreaker"
          component={MatchesScreen}
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
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: colors.primary,
    borderTopWidth: 0,
    paddingBottom: Platform.OS === "ios" ? 20 : 10,
    elevation: 8,
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
