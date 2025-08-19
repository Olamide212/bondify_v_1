import { View, Text, Pressable } from "react-native";
import React, { useState } from "react";
import { Image } from "expo-image";
import { images } from "../../constant/images";
import { ListFilter, RotateCcw, SlidersHorizontal } from "lucide-react-native";
import { useRouter } from "expo-router";
import FilterModal from "../modals/FilterModal";


const HomeHeader = () => {
  const [showModal, setShowModal] = useState("")
  const router = useRouter()
  return (
    <View className="flex-row items-center justify-between bg-transparent  py-2">
      <Image
        source={images.bondifyLogoColored}
        style={{ width: 110, height: 40 }}
        contentFit="contain"
      />
      <View className="flex-row">
        <View className="w-10 h-10   justify-center items-center rounded-full">
          <RotateCcw size={24} color="gray" />
        </View>

        <Pressable onPress={() => setShowModal(true)}>
          <View className="w-10 h-10    justify-center items-center rounded-full">
            <SlidersHorizontal size={24} color="gray" />
          </View>
        </Pressable>
      </View>
      <FilterModal visible={showModal} onClose={() => setShowModal(false)} />
    </View>
  );
};

export default HomeHeader;
