import React from "react";
import { View, Text } from "react-native";
import { Wine, Cigarette, Dog, Dumbbell } from "lucide-react-native";

const Lifestyle = ({ drinking, smoking, pets, workout }) => {
  return (
    <View className="px-4 py-2">
      <Text className="text-lg font-semibold mb-2">Lifestyle</Text>
      <View className="flex-row items-center mb-1">
        <Wine size={18} className="mr-2" />
        <Text>{drinking}</Text>
      </View>
      <View className="flex-row items-center mb-1">
        <Cigarette size={18} className="mr-2" />
        <Text>{smoking}</Text>
      </View>
      <View className="flex-row items-center mb-1">
        <Dog size={18} className="mr-2" />
        <Text>{pets}</Text>
      </View>
      <View className="flex-row items-center">
        <Dumbbell size={18} className="mr-2" />
        <Text>{workout}</Text>
      </View>
    </View>
  );
};

export default Lifestyle;
