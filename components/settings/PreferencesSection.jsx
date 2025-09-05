import React from "react";
import { Crown, Globe, BadgeCheck, Plane } from "lucide-react-native";
import SettingCard from "./SettingCard";

const PreferencesSection = () => {
  const items = [
    {
      title: "Theme",
      onPress: () => console.log("Navigate to Verification"),
    },
    {
      title: "Notification Settings",

      onPress: () => console.log("Navigate to Premium"),
    },
    {
      title: "Discovery Settings",
      onPress: () => console.log("Navigate to Premium"),
    },
  ];

  return <SettingCard  items={items} />;
};

export default PreferencesSection;
