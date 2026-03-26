import { View, Text, Pressable, TouchableOpacity } from "react-native";
import React from "react";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { images } from "../../constant/images"
import { ArrowLeft } from "lucide-react-native";
import { colors } from "../../constant/colors";
import { fonts } from "../../constant/fonts";

const HeaderWithLogo = ({ 
  title, 
  showBackButton = true, 
  showSkipButton = false, 
  onSkip 
}) => {
  const router = useRouter();

  return (
    <View className="flex-row items-center justify-between pt-3">
      {showBackButton ? (
        <Pressable onPress={() => router.back()}>
          <ArrowLeft />
        </Pressable>
      ) : (
        <View style={{ width: 24 }} />
      )}

      <Image
        source={images.bondiesMainicon}
        style={{ width: 60, height: 40 }}
        contentFit="contain"
      />

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
      ) : title ? (
        <Text className="text-white font-PlusJakartaSansMedium">{title}</Text>
      ) : (
        <View style={{ width: 24 }} />
      )}
    </View>
  );
};

export default HeaderWithLogo;
