import React from "react";
import { Crown, Globe, BadgeCheck, Plane } from "lucide-react-native";
import SettingCard from "./SettingCard";

const LegalSection = () => {
  const items = [
    {
      title: "Terms of Services",
      onPress: () => console.log("Navigate to Verification"),
    },
    {
      title: "Privacy Policy",
      onPress: () => console.log("Navigate to Premium"),
    },
    {
      title: "Cookie Policy",
      onPress: () => console.log("Navigate to Premium"),
    },

  ];

  return <SettingCard title={"Legal"} items={items} />;
};

export default LegalSection;
