import React from "react";
import { View, TouchableOpacity, Image } from "react-native";
import {
  X,
  Heart,
 Sparkles,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import Entypo from "@expo/vector-icons/Entypo";
import { images } from "../../constant/images"
import { colors } from "../../constant/colors";

const ActionButtons = ({ onSwipe, onSuperLike }) => (
  <View className="flex-row justify-center items-center gap-2 px-4 py-6">
    <TouchableOpacity
      onPress={() => onSwipe("left")}
      className="w-[55px] h-[55px] bg-white rounded-full items-center justify-center shadow"
    >
      <X size={26} color="#000" fill="#000" />
    </TouchableOpacity>

    <TouchableOpacity className="w-[70px] h-[70px] bg-primary rounded-full items-center justify-center shadow">
      <Sparkles size={30} color="#fff" fill="#fff" />
    </TouchableOpacity>
    <TouchableOpacity
      onPress={() => onSwipe("right")}
      className="w-[55px] h-[55px] bg-white rounded-full items-center justify-center shadow"
    >
      <Heart size={26} color="#FB3857" fill="#FB3857" />
    </TouchableOpacity>
  </View>
);

export default ActionButtons;
