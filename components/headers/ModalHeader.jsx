import { View, Text, TouchableOpacity } from "react-native";
import React from "react";
import { Ionicons } from "@expo/vector-icons";

const ModalHeader = ({ onClose, centerText, rightText, onRightPress }) => {
  return (
    <View>
      {/* Header */}
      <View className="flex-row justify-between items-center px-4 pb-5 ">
        {/* Close Button */}
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>

        {/* Title */}
        <Text className="text-xl font-OutfitBold text-white">{centerText}</Text>

        {/* Right Action */}
        {rightText ? (
          <TouchableOpacity onPress={onRightPress}>
            <Text className="text-primary font-OutfitBold">{rightText}</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} /> // placeholder for alignment
        )}
      </View>
    </View>
  );
};

export default ModalHeader;
