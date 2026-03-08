import React from "react";
import { Crown, Globe, BadgeCheck, Plane } from "lucide-react-native";
import SettingCard from "./SettingCard";
import { useRouter } from "expo-router";

const LegalSection = () => {
const router = useRouter()

  const items = [
    {
      title: "Terms of Services",
      onPress: () => router.push("/terms-of-services"),
    },
    {
      title: "Privacy Policy",
      onPress: () => router.push("/privacy-policy"),
    },
    {
      title: "Cookie Policy",
      onPress: () => router.push("/cookie-policy"),
    },

  ];

  return <SettingCard title={"Legal"} items={items} />;
};

export default LegalSection;
