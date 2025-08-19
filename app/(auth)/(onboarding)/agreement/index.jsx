import { View, Text } from "react-native";
import React from "react";
import {
  HeartHandshake,
  MessageCircleMore,
  ThumbsDown,
  ShieldCheck,
  Smile,
} from "lucide-react-native";
import Button from "../../../../components/ui/Button"
import { useRouter } from "expo-router";

const guidelines = [
  {
    icon: <HeartHandshake size={24} color="#FF0066" />,
    title: "Be Respectful",
    description: "Treat others with kindness and courtesy.",
  },
  {
    icon: <MessageCircleMore size={24} color="#FF0066" />,
    title: "Authentic Conversations",
    description: "Be yourself and engage in honest conversations.",
  },
  {
    icon: <ThumbsDown size={24} color="#FF0066" />,
    title: "No Harassment",
    description: "Hate speech, bullying, or harassment won’t be tolerated.",
  },
  {
    icon: <ShieldCheck size={24} color="#FF0066" />,
    title: "Stay Safe",
    description:
      "Protect your personal information and report suspicious behavior.",
  },
  {
    icon: <Smile size={24} color="#FF0066" />,
    title: "Spread Positivity",
    description: "Create a welcoming space for everyone.",
  },
];

const Agreement = () => {
  const router = useRouter()
  return (
    <View className="bg-white flex-1 px-4 pt-8">
      <Text className="text-3xl font-SatoshiBold">Welcome to Bondify!</Text>
      <Text className="mt-3 font-Satoshi text-lg text-gray-700">
        To ensure the best experience, we ask that you follow our community
        guidelines:
      </Text>

      <View className="mt-6 gap-5 flex-1">
        {guidelines.map((item, index) => (
          <View key={index} className="flex-row items-start gap-3">
            <View className="mt-1">{item.icon}</View>
            <View>
              <Text className="text-xl font-SatoshiBold">{item.title}</Text>
              <Text className="text-lg font-Satoshi text-app pr-6">{item.description}</Text>
            </View>
          </View>
        ))}

    
      </View>

      <Button variant="gradient" title="Agree & Continue" onPress={() => router.push("/age")} />
    </View>
  );
};

export default Agreement;
