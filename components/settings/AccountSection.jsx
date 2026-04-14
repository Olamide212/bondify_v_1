/**
 * components/settings/AccountSettings.jsx  (or wherever this lives)
 * Updated to navigate to the dedicated update screens.
 */

import { useRouter } from "expo-router";
import { useState } from "react";
import { useSelector } from "react-redux";
import SubscriptionModal from "../../components/modals/SubscriptionModal";
import SettingCard from "./SettingCard";


const AccountSettings = () => {
  const router = useRouter();
  const [premiumModalVisible, setPremiumModalVisible] = useState(false);

  // Pull live values from Redux store so the descriptions stay in sync
  // after a successful update. Adjust the selector path to match your slice.
  const user = useSelector((state) => state.auth?.user);

  // Calculate age from dateOfBirth
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age;
  };

  const userAge = calculateAge(user?.dateOfBirth);

  const items = [
    {
      title: "Phone number",
      description: user?.phoneNumber ?? "+2348100275274",
      onPress: () => router.push("/update-phone"),
    },
    {
      title: "Email address",
      description: user?.email ?? "olabid212@gmail.com",
      onPress: () => router.push("/update-email"),
    },
    {
      title: "Birthday",
      description: userAge ? `${userAge} years old` : "Set your birthday",
      onPress: () => router.push("/edit-birthday"),
    },
    {
      title: "Change Password",
      description: "Change your account password",
      onPress: () => router.push("/change-password"),
    },
    // {
    //   title: "Get Premium",
    //   description: "Unlock all premium features for the best experience.",
    //   onPress: () => setPremiumModalVisible(true),
    // },
    {
      title: "Invite friends",
      description: "Get access to 5 free sparks when you invite a friend",
      onPress: () => router.push("/invite"),
    },
  ];

  return (
    <>
      <SettingCard title="Account" items={items} />
 
      {/* Subscription Modal */}
      <SubscriptionModal
        visible={premiumModalVisible}
        onClose={() => setPremiumModalVisible(false)}
      />
    </>
  );
};

export default AccountSettings;
