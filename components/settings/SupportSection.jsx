import React from "react";
import { Crown, Globe, BadgeCheck, Plane } from "lucide-react-native";
import SettingCard from "./SettingCard";
import { useRouter } from "expo-router";


const SupportSection = () => {
const router = useRouter()

  const items = [
    {
      title: "Help Center (FAQ)",
      onPress: () => router.push("/faq"),
    },
    {
      title: "Report a Problem",
      onPress: () => router.push("/report-a-problem"),
    },
    {
      title: "Contact Support",
      onPress: () => router.push("/contact-support"),
    },
    {
      title: "Community Guidelines",
      onPress: () => router.push("/community-guidelines"),
    },
  ];

  return <SettingCard title={"Support"} items={items} />;
};

export default SupportSection;
