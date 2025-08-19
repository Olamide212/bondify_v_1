// app/FilterScreen.js
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function FilterScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color="#000" />
        </TouchableOpacity>
        <Text className="text-lg font-bold">Filters</Text>
        <TouchableOpacity>
          <Text className="text-blue-500 font-semibold">Reset</Text>
        </TouchableOpacity>
      </View>

      {/* Filter content */}
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text className="text-gray-500 mb-4">Age Range</Text>
        {/* Add your sliders, toggles, selectors here */}

        <Text className="text-gray-500 mt-6 mb-4">Distance</Text>
        {/* Example distance slider */}

        <Text className="text-gray-500 mt-6 mb-4">Interests</Text>
        {/* Example tags */}

        <View style={{ height: 300 }} />
      </ScrollView>

      {/* Bottom Apply Button */}
      <View className="p-4 border-t border-gray-200">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="bg-blue-500 py-4 rounded-xl items-center"
        >
          <Text className="text-white font-semibold">Apply Filters</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
