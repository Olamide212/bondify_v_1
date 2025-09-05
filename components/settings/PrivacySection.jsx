import React from "react";
import { Crown, Globe, BadgeCheck, Plane } from "lucide-react-native";
import SettingCard from "./SettingCard";

const PrivacySection = () => {
  const items = [
    {
      title: "Blocked user",
      description: "List of blocked users",
      onPress: () => console.log("Navigate to Verification"),
    },
    {
      title: "Privacy settings",
      description: "configure who can view your profile and how they contact you",
      onPress: () => console.log("Navigate to Premium"),
    },
 
  ];

  return <SettingCard items={items} />;
};

export default PrivacySection;
