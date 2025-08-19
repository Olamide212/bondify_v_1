import { View, Text, Pressable } from "react-native";
import React from "react";
import { Image } from "expo-image";
import Entypo from "@expo/vector-icons/Entypo";
import { useRouter } from "expo-router";
import { images } from "../../constant/images";
import { ArrowLeft } from "lucide-react-native";

const AccountSetupHeader = ({ title, rightText }) => {
const router = useRouter()    

  return (
    <View className="flex-row items-center justify-between pt-3">
      <Pressable onPress={() => router.back()}>
        <ArrowLeft />
      </Pressable>

      <Text className="text-app font-SatoshiBold text-[20px]">{title}</Text>
      <Text className="text-app font-SatoshiMedium">{rightText}</Text>
    </View>
  );
};

export default AccountSetupHeader;
