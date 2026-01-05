import { View, Text, Pressable } from "react-native";
import React from "react";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";

const AccountSetupHeader = ({ title, rightText, showBack = true }) => {
  const router = useRouter();

  return (
    <View className="flex-row items-center justify-between pt-3 px-4">
      {showBack ? (
        <Pressable onPress={() => router.back()}>
          <ArrowLeft />
        </Pressable>
      ) : (
        // keeps title centered when back button is hidden
        <View style={{ width: 24 }} />
      )}

      <Text className="text-app font-SatoshiBold text-[20px]">{title}</Text>

      {rightText ? (
        <Text className="text-app font-SatoshiMedium">{rightText}</Text>
      ) : (
        <View style={{ width: 24 }} />
      )}
    </View>
  );
};

export default AccountSetupHeader;
