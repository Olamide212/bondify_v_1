import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Crown, Globe, BadgeCheck, Plane, Award } from "lucide-react-native";
import { useRouter } from "expo-router";


const InfoSection = () => {

const router = useRouter()


  const items = [
    {
      title: "Verification",
      description: "Build trust and let others know you’re the real deal.",
      icon: BadgeCheck,
      link: "Verification",
    },
    {
      title: "Get Premium",
      description: "Unlock all premium features for the best experience.",
      icon: Crown,
      link: "Premium",
    },
    {
      title: "Badges",
      description: "Collect badges as you connect, match, and engage.",
      icon: Award,
      link: "badges",
    },
    {
      title: "Bondify Hop",
      description: "Travel anywhere digitally and connect worldwide.",
      icon: Plane,
      link: "Passport",
    },
  ];

  return (
    <View className="bg-white mt-3 mx-4 p-5 rounded-xl">
      {items.map(({ title, description, icon: Icon, link }, index) => {
        const isLast = index === items.length - 1;

        return (
          <TouchableOpacity
            key={index}
            className={`flex-row items-center justify-between py-4 ${
              !isLast ? "border-b border-gray-200" : ""
            }`}
            onPress={() => router.push(link)}
          >
            <View className="flex-row items-center gap-3 flex-1">
              <Icon size={22} color="#4B164C" fill="#fff" />
              <View className="flex-1">
                <Text className="text-xl text-black  font-GeneralSansMedium">
                  {title}
                </Text>
                <Text className="text-lg text-gray-500 font-Satoshi">
                  {description}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default InfoSection;
