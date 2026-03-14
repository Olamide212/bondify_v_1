/**
 * PreferencesSection.js
 *
 * App Preferences settings section.
 * Shows a right-side chevron hint for the active theme so users can glance
 * at the current setting without opening the screen.
 */

import React from "react";
import { useRouter } from "expo-router";
import SettingCard from "./SettingCard";
import { useTheme } from "../../context/ThemeContext";

const THEME_LABELS = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

const PreferencesSection = () => {
  const router = useRouter();
  const { theme } = useTheme();

  const items = [
    // {
    //   title: "Theme",
    //   // Shows e.g. "System" as a subtle hint in the row (if SettingCard supports it)
    //   subtitle: THEME_LABELS[theme] ?? "System",
    //   onPress: () => router.push("/theme-settings"),
    // },
    {
      title: "Notification Settings",
      onPress: () => router.push("/notification-settings"),
    },
    // {
    //   title: "Discovery Settings",
    //   onPress: () => router.push("/discovery-settings"),
    // },
  ];

  return <SettingCard title="App Preferences" items={items} />;
};

export default PreferencesSection;