import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Plus, X } from "lucide-react-native";

const AnswersSection = ({ answers }) => {
  return (
    <View className="bg-white mt-3">
      <Text className="p-4 font-semibold text-base">My Answers</Text>
      {answers.map((item, idx) => (
        <View key={idx} className="p-4 border-t border-gray-200">
          <View className="flex-row justify-between items-center">
            <Text className="font-semibold">{item.prompt}</Text>
            <TouchableOpacity>
              <X size={18} color="#999" />
            </TouchableOpacity>
          </View>
          <Text className="text-gray-600 mt-2">{item.answer}</Text>
        </View>
      ))}
      <TouchableOpacity className="flex-row items-center p-4">
        <Plus size={18} color="#00C4B3" />
        <Text className="ml-2 text-teal-600">Add a question...</Text>
      </TouchableOpacity>
    </View>
  );
};

export default AnswersSection;
