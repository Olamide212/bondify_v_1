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
      {/*    <Image
        source={require("../../assets/images/bondies-logo-gray.png")}
        style={{ width: 110, height: 40 }}
        contentFit="contain"
      />*/}
      <View className="flex-row gap-2">
        <View className="w-12 h-12 bg-black/20   justify-center items-center rounded-full">
          <RotateCcw size={20} color="white" />
        </View>

        <Pressable onPress={() => setShowModal(true)}>
          <View className="w-12 h-12  bg-black/20  justify-center items-center rounded-full">
            <Image
              source={require("../../assets/icons/Slider-white.png")}
              style={{ width: 18, height: 18 }}
              contentFit="contain"
            />
          </View>
        </Pressable>
      </View>

      <FilterModal visible={showModal} onClose={() => setShowModal(false)} />
    </View>
  );
};

export default HomeHeader;
