import { View, Text, Pressable } from "react-native";
import React from "react";
import { useRouter } from "expo-router";

const HeaderWithLogo = ({ title, icon, onPress, leftIcon, className = "" }) => {
  const router = useRouter();

  return (
    <View className={`flex-row items-center justify-between px-4 py-4 ${className} `}>
      <Pressable onPress={() => router.back()}>{leftIcon}</Pressable>
      <Text className={`text-black text-2xl font-SatoshiBold ${className}`}>
        {title}
      </Text>
      <Pressable onPress={onPress}>{icon}</Pressable>
    </View>
  );
};

export default HeaderWithLogo;
