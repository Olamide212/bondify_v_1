import React from "react";
import { Crown, Globe, BadgeCheck, Plane } from "lucide-react-native";
import SettingCard from "./SettingCard";

const AccountSettings = () => {
  const items = [
    {
      title: "Phone number",
      description: "+2348100275274",
      onPress: () => console.log("Navigate to Verification"),
    },
    {
      title: "Email address",
      description: "olabid212@gmail.com",
      onPress: () => console.log("Navigate to Premium"),
    },
    {
      title: "Change Password",
      description: "Change your account password",
      onPress: () => console.log("Navigate to Premium"),
    },
    {
      title: "Get Premium",
      description: "Unlock all premium features for the best experience.",

      onPress: () => console.log("Navigate to Passport"),
    },
    {
      title: "Invite friends",
      description: "Get access to 5 free sparks when you invite a friend",
      onPress: () => console.log("Navigate to Passport"),
    },
  ];

  return <SettingCard title="Account"  items={items} />;
};

export default AccountSettings;
