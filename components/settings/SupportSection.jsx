import React from "react";
import { Crown, Globe, BadgeCheck, Plane } from "lucide-react-native";
import SettingCard from "./SettingCard";

const SupportSection = () => {
  const items = [
    {
      title: "Help Center (FAQ)",
      onPress: () => console.log("Navigate to Verification"),
    },
    {
      title: "Report a Problem",
      onPress: () => console.log("Navigate to Premium"),
    },
    {
      title: "Contact Support",
      onPress: () => console.log("Navigate to Premium"),
    },
    {
      title: "Community Guidelines",
      onPress: () => console.log("Navigate to Premium"),
    },
  ];

  return <SettingCard items={items} />;
};

export default SupportSection;
