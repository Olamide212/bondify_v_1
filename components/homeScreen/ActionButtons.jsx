import React from "react";
import { View, TouchableOpacity, Image } from "react-native";
import {
  X,
  Heart,
  WandSparkles,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import Entypo from "@expo/vector-icons/Entypo";
import { images } from "../../constant/images"
import { colors } from "../../constant/colors";

const ActionButtons = ({ onSwipe, onSuperLike }) => (
  <View className="flex-row justify-between items-center gap-2 px-4 py-6">
    <TouchableOpacity
      onPress={() => onSwipe("left")}
      className="w-[65px] h-[65px] bg-white rounded-full items-center justify-center shadow"
    >
      <Image
        source={require("../../assets/images/cancel.png")}
        resizeMode="contain"
        style={{ width: 28, height: 28 }}
      />
    </TouchableOpacity>

    <View className="flex-row items-center gap-3">
      <TouchableOpacity className="w-[60px] h-[60px] bg-primary rounded-full items-center justify-center shadow">
        <WandSparkles size={30} color="white" fill="white" />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => onSwipe("right")}
        className="w-[65px] h-[65px] bg-white rounded-full items-center justify-center shadow"
      >
        <Heart size={35} color="#FB3857" fill="#FB3857" />
      </TouchableOpacity>
    </View>
  </View>
);

export default ActionButtons;
