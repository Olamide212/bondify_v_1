// File: /app/discover/hangouts.jsx
import { View, Text, ScrollView, Image, TouchableOpacity } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import GeneralHeader from "../../../../components/headers/GeneralHeader";

const mockHangouts = [
  {
    id: 1,
    title: "Beach Volleyball Meetup",
    description: "Join a fun game at Elegushi beach",
    // image: require("../../../assets/discover/hangouts/beach.jpg"),
    date: "Sat, Sep 14",
    time: "4:00 PM",
  },
  {
    id: 2,
    title: "Lagos Food Tour",
    description: "Taste your way through the best spots",
    // image: require("../../../assets/discover/hangouts/food.jpg"),
    date: "Sun, Sep 15",
    time: "1:00 PM",
  },
];

export default function HangoutsScreen() {
  return (
    <SafeAreaView style={{flex: 1}} className="bg-white">
      <GeneralHeader title="Nearby Hangouts" />
      <ScrollView className="px-4 mt-2">
        {mockHangouts.map((event) => (
          <TouchableOpacity
            key={event.id}
            className="bg-white rounded-xl mb-4 overflow-hidden shadow-md"
          >
            <Image
              source={event.image}
              className="w-full h-48"
              resizeMode="cover"
            />
            <View className="p-4">
              <Text className="text-lg font-bold text-gray-900">
                {event.title}
              </Text>
              <Text className="text-sm text-gray-600 mt-1">
                {event.description}
              </Text>
              <Text className="text-xs text-gray-400 mt-2">
                {event.date} • {event.time}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
