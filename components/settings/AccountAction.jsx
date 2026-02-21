import React from "react";
import { LogOut, Trash } from "lucide-react-native";
import { useDispatch } from "react-redux";
import { useRouter } from "expo-router";
import { logout } from "../../slices/authSlice";
import SettingCard from "./SettingCard";

const AccountAction = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const handleLogout = () => {
    dispatch(logout());
    router.replace("/login");
  };

  const items = [
    {
      title: "Log Out",
      icon: LogOut,
      onPress: handleLogout,
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
