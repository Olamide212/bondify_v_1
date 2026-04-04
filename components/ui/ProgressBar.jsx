// components/ui/ProgressBar.jsx
import React from "react";
import { View } from "react-native";

export const ProgressBar = ({ progress }) => {
  return (
    <View className="h-1 w-full bg-gray-700 rounded-full mt-4 overflow-hidden">
      <View
        className="h-full bg-primary rounded-full"
        style={{ width: `${progress * 100}%` }}
      />
    </View>
  );
};
