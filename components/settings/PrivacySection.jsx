import React from "react";
import { Crown, Globe, BadgeCheck, Plane } from "lucide-react-native";
import SettingCard from "./SettingCard";
import { useRouter } from "expo-router";

const PrivacySection = () => {

const router = useRouter()


  const items = [
    {
      title: "Blocked user",
      description: "List of blocked users",
      onPress: () => router.push("/blocked-users"),
    },
    {
      title: "Privacy settings",
      description: "configure who can view your profile and how they contact you",
      onPress: () => router.push("/privacy-settings"),
    },
 
  ];

  return <SettingCard title={"Privacy Policy"} items={items} />;
};

export default PrivacySection;
