import { useRouter } from "expo-router";
import { LogOut, Trash } from "lucide-react-native";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { profileService } from "../../services/profileService";
import { logout } from "../../slices/authSlice";
import DeleteAccountModal from "../modals/DeleteAccountModal";
import SettingCard from "./SettingCard";

const AccountAction = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const currentUser = useSelector((state) => state.auth.user);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const dismissAndGoToLogin = () => {
    try {
      router.dismissAll();
    } catch (_error) {
      // ignore when there is no dismissible stack
    }
    router.replace("/login");
  };

  const handleLogout = async () => {
    // Clear user cache before logging out
    if (currentUser?.id || currentUser?._id) {
      const userId = currentUser.id || currentUser._id;
      await profileService.onUserLogout(userId);
    }
    dispatch(logout());
    dismissAndGoToLogin();
  };

  const handleDeleted = async () => {
    // Clear user cache before logging out
    if (currentUser?.id || currentUser?._id) {
      const userId = currentUser.id || currentUser._id;
      await profileService.onUserLogout(userId);
    }
    setShowDeleteModal(false);
    dispatch(logout());
    dismissAndGoToLogin();
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