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
  <View className="flex-row justify-between items-center gap-2 px-8 py-6">
    {/* Dislike Button */}
    <TouchableOpacity
      onPress={() => onSwipe("left")}
      className="w-14 h-14 bg-white rounded-full items-center justify-center shadow"
    >
      <X size={26} color="black" fill="#979797" />
    </TouchableOpacity>

    {/* Superlike Button with Gradient 
    <LinearGradient
      colors={["#FD465C", "#A80EC1"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        borderRadius: 999,
        width: 60,
        height: 60,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOpacity: 0.3,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 2 },
      }}
    >
      <TouchableOpacity
        onPress={onSuperLike}
        activeOpacity={0.8}
        style={{
          width: 64,
          height: 64,
          borderRadius: 999,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <WandSparkles color="#fff" size={24} />
      </TouchableOpacity>
    </LinearGradient> */}

    {/* Like Button */}
    <TouchableOpacity

      className="w-[70px] h-[70px] bg-primary rounded-full items-center justify-center shadow"
    >
      <WandSparkles size={30} color="white" fill="white" />
    </TouchableOpacity>

    <TouchableOpacity
      onPress={() => onSwipe("right")}
      className="w-14 h-14 bg-white rounded-full items-center justify-center shadow"
    >
      <Heart size={26} color="#FB3857" fill="#FB3857" />
    </TouchableOpacity>
  </View>
);

export default ActionButtons;
