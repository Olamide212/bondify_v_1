/**
 * PreferencesSection.js
 *
 * App Preferences settings section.
 */

import React from "react";
import { useRouter } from "expo-router";
import SettingCard from "./SettingCard";

const PreferencesSection = () => {
  const router = useRouter();

  const items = [
    {
      title: "Notification Settings",
      onPress: () => router.push("/notification-settings"),
    },
    {
      title: "AI Assistant Settings",
      onPress: () => router.push("/ai-settings"),
    },
  ];

  return <SettingCard title="App Preferences" items={items} />;
};

export default PreferencesSection;