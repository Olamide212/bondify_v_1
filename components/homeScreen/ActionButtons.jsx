import React from "react";
import { View, TouchableOpacity, Image } from "react-native";
import {
  X,
  Heart,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import Entypo from "@expo/vector-icons/Entypo";
import { images } from "../../constant/images"
import { colors } from "../../constant/colors";

const ActionButtons = ({ onSwipe, onSuperLike, Redo=false }) => (
  <View className="flex-row justify-center items-center gap-4 px-4 py-6">
    {Redo && (
      <TouchableOpacity
        onPress={() => onSwipe("left")}
        className="w-[60px] h-[60px] bg-gray-800 rounded-full items-center justify-center "
      >
        <RotateCcw size={26} color="#fff" />
      </TouchableOpacity>
    )}

    <TouchableOpacity
      onPress={() => onSwipe("left")}
      className="w-[50px] h-[50px] bg-white rounded-full items-center justify-center shadow"
    >
      <X size={26} color="#000" fill="#000" />
    </TouchableOpacity>

    <TouchableOpacity className="w-[70px] h-[70px] bg-primary rounded-full items-center justify-center ">
      <Sparkles size={30} color="#fff" fill="#fff" />
    </TouchableOpacity>
    <TouchableOpacity
      onPress={() => onSwipe("right")}
      className="w-[50px] h-[50px] bg-white rounded-full items-center justify-center shadow"
    >
      <Heart size={26} color="#FB3857" fill="#FB3857" />
    </TouchableOpacity>
  </View>
);

export default ActionButtons;
