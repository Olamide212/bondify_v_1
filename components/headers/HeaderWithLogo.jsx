import { View, Text, Pressable } from "react-native";
import React from "react";
import { Image } from "expo-image";
import Entypo from "@expo/vector-icons/Entypo";
import { useRouter } from "expo-router";
import { images } from "../../constant/images"
import { ArrowLeft } from "lucide-react-native";

const HeaderWithLogo = ({ title, showBackButton = true }) => {
const router = useRouter()    

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
      <Text className="text-white font-SatoshiMedium">{title}</Text>
    </View>
  );
};

export default HeaderWithLogo;
