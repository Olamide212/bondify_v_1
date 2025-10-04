import { View, Text, TouchableOpacity } from "react-native";
import React from "react";
import { CalendarX } from "lucide-react-native";

const Events = () => {
  return (
    <View className="flex-1 bg-white items-center justify-center p-6">
      {/* Icon */}
      <CalendarX size={64} color="#9ca3af" strokeWidth={1.5} />

      {/* Title */}
      <Text className="text-2xl font-GeneralSansBold text-black mt-6">
        No Events Yet
      </Text>

      {/* Description */}
      <Text className="text-center text-gray-600 font-Satoshi text-base mt-2 px-4">
        Stay tuned! Bondify events and communities will appear here soon.
        Connect, share, and meet amazing people once we go live.
      </Text>

      {/* Placeholder action */}
      <TouchableOpacity className="mt-6 bg-black px-6 py-3 rounded-full">
        <Text className="text-white font-GeneralSansMedium text-lg">
          Explore Bondies
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default Events;
