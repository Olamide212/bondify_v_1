import React, { useState } from "react";
import { LogOut, Trash } from "lucide-react-native";
import { useDispatch } from "react-redux";
import { useRouter } from "expo-router";
import { logout } from "../../slices/authSlice";
import SettingCard from "./SettingCard";
import DeleteAccountModal from "../modals/DeleteAccountModal";

const AccountAction = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    router.replace("/login");
  };

  const handleDeleted = () => {
    setShowDeleteModal(false);
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
      onPress: () => setShowDeleteModal(true),
    },
  ];

  return (
    <>
      <SettingCard items={items} />
      <DeleteAccountModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onDeleted={handleDeleted}
      />
    </>
  );
};

export default AccountAction;