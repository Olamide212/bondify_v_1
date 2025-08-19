import React from "react";
import { View, TouchableOpacity } from "react-native";
import { X, Heart, WandSparkles, ThumbsUp } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import Entypo from "@expo/vector-icons/Entypo";

const ActionButtons = ({ onSwipe, onSuperLike }) => (
  <View className="flex-row justify-between items-center gap-4 px-8 py-6">
    {/* Dislike Button */}
    <TouchableOpacity
      onPress={() => onSwipe("left")}
      className="w-16 h-16 bg-white rounded-full items-center justify-center shadow"
    >
      <Entypo name="hand" size={26} color="#FF0066" />
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
      onPress={() => onSwipe("right")}
      className="w-16 h-16 bg-[#FF0066] rounded-full items-center justify-center shadow"
    >
      <Heart color="#FFf" size={28} fill="#FFf" />
    </TouchableOpacity>
  </View>
);

export default ActionButtons;
