import React from "react";
import { View, Text } from "react-native";

const Interests = ({ interests }) => {
  return (
    <View className="px-4 py-2">
      <Text className="text-lg font-semibold mb-2">Interests</Text>
      <View className="flex-row flex-wrap">
        {interests.map((item, idx) => (
          <View
            key={idx}
            className="bg-gray-200 rounded-full px-3 py-1 mr-2 mb-2"
          >
            <Text>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export default Interests;
