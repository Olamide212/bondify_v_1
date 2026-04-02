/**
 * components/settings/AccountSettings.jsx  (or wherever this lives)
 * Updated to navigate to the dedicated update screens.
 */

import React, { useState }  from "react";
import { useRouter } from "expo-router";
import { useSelector } from "react-redux";
import SettingCard from "./SettingCard";
import SubscriptionModal from "../../components/modals/SubscriptionModal"


const AccountSettings = () => {
  const router = useRouter();
  const [premiumModalVisible, setPremiumModalVisible] = useState(false);

  // Pull live values from Redux store so the descriptions stay in sync
  // after a successful update. Adjust the selector path to match your slice.
  const user = useSelector((state) => state.auth?.user);

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
