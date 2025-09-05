import React from "react";
import { LogOut, Plane, Trash } from "lucide-react-native";
import SettingCard from "./SettingCard";

const AccountAction = () => {
  const items = [
    {
      title: "Log Out",
      icon: LogOut,
      onPress: () => console.log("Navigate to Verification"),
    },
    {
      title: "Delete Account",
      icon: Trash,
      onPress: () => console.log("Navigate to Premium"),
    },
  ];

  return <SettingCard  items={items} />;
};

export default AccountAction;
