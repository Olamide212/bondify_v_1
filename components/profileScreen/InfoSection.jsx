import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import {
  Crown,
  BadgeCheck,
  Plane,
  Pencil,
  Settings,
  SlidersHorizontal,
  Shield,
  HelpCircle,
  Users,
  Coins,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import SubscriptionModal from "../modals/SubscriptionModal";
import FilterModal from "../modals/FilterModal";
import WalletModal from "../modals/WalletModal"; 
import BondiesHobModal from "../modals/BondiesHopModal"



const InfoSection = () => {
  const router = useRouter();
  const [showSubscription, setShowSubscription] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [showBondiesHob, setShowBondiesHob] = useState(false)

  const items = [
    {
      title: "Edit Profile",
      description: "Complete or modify your profile details.",
      icon: Pencil,
      link: "edit-profiles",
    },
    {
      title: "Search Filters",
      description: "Find exactly who you’re looking for with custom filters.",
      icon: SlidersHorizontal,
      modal: "filters",
    },
    {
      title: "Verification",
      description: "Build trust and let others know you’re the real deal.",
      icon: BadgeCheck,
      link: "verification",
    },
    {
      title: "Get Premium",
      description: "Unlock all premium features for the best experience.",
      icon: Crown,
      modal: "subscription",
    },
    {
      title: "Bondies Hop",
      description: "Travel anywhere digitally and connect worldwide.",
      icon: Plane,
      modal: "passport",
    },
    {
      title: "Coin Wallet & Gifts",
      description: "Check your coin balance, buy coins, and send gifts.",
      icon: Coins,
      modal: "wallet", // 🔑 opens wallet modal
    },
    {
      title: "Settings",
      description: "Manage your preferences, notifications, and privacy.",
      icon: Settings,
      link: "settings",
    },
    {
      title: "Events and Communities",
      description:
        "Join upcoming events, meet people, and connect with communities.",
      icon: Shield,
      link: "events", // 🔑 updated to go to Events screen
    },
    {
      title: "Support",
      description: "Get help, FAQs, and contact support if needed.",
      icon: HelpCircle,
      link: "support",
    },
    {
      title: "Invite Friends",
      description: "Share Bondify and get rewards when friends join.",
      icon: Users,
      link: "invite",
    },
  ];

  return (
    <>
      <View className="bg-white p-5 rounded-xl">
        {items.map(({ title, description, icon: Icon, link, modal }, index) => {
          const isLast = index === items.length - 1;

          return (
            <TouchableOpacity
              key={index}
              className={`flex-row items-center justify-between py-5 ${
                !isLast ? "border-b border-gray-200" : ""
              }`}
              onPress={() => {
                if (modal === "subscription") {
                  setShowSubscription(true);
                } else if (modal === "filters") {
                  setShowFilter(true);
                } else if (modal === "wallet") {
                  setShowWallet(true);
                } else if (modal === "passport") {
                  setShowBondiesHob(true);
                } else {
                  router.push(link);
                }
              }}
            >
              <View className="flex-row items-center gap-3 flex-1">
                <Icon size={20} />
                <View className="flex-1">
                  <Text className="text-xl text-black font-GeneralSansMedium">
                    {title}
                  </Text>
                  <Text className="text-base text-gray-700 font-Satoshi">
                    {description}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Subscription Modal */}
      <SubscriptionModal
        visible={showSubscription}
        onClose={() => setShowSubscription(false)}
      />

      {/* Filter Modal */}
      <FilterModal visible={showFilter} onClose={() => setShowFilter(false)} />

      {/* Wallet Modal */}
      <WalletModal visible={showWallet} onClose={() => setShowWallet(false)} />

      <BondiesHobModal visible={showBondiesHob} onClose={() => setShowBondiesHob(false)} />
    </>
  );
};

export default InfoSection;
