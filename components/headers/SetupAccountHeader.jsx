import { View, Text, Pressable, TouchableOpacity } from "react-native";
import React from "react";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { colors } from "../../constant/colors";
import { fonts } from "../../constant/fonts";

const AccountSetupHeader = ({ 
  title, 
  rightText, 
  showBack = true,
  showSkipButton = false,
  onSkip
}) => {
  const router = useRouter();

  return (
    <View className="flex-row items-center justify-between pt-3 ">
      {showBack ? (
        <Pressable onPress={() => router.back()}>
          <ArrowLeft />
        </Pressable>
      ) : (
        // keeps title centered when back button is hidden
        <View style={{ width: 24 }} />
      )}

      <Text className="text-app font-PlusJakartaSansBold text-[20px]">{title}</Text>

      {showSkipButton && onSkip ? (
        <TouchableOpacity onPress={onSkip} activeOpacity={0.7}>
          <Text
            style={{
              color: colors.primary,
              fontFamily: fonts.PlusJakartaSansMedium,
              fontSize: 14,
            }}
          >
            Skip
          </Text>
        </TouchableOpacity>
      ) : rightText ? (
        <Text className="text-app font-PlusJakartaSansMedium">{rightText}</Text>
      ) : (
        <View style={{ width: 24 }} />
      )}
    </View>
  );
};

export default AccountSetupHeader;
