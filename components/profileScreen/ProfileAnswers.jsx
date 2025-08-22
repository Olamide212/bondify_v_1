import { View, Text, TouchableOpacity } from "react-native";
import React from "react";
import { Plus } from "lucide-react-native";

const ProfileAnswers = ({ profile }) => {
  return (
    <View className="px-6 py-4 bg-white mx-4 rounded-2xl mt-4">
      <Text className="mb-2 font-SatoshiMedium text-lg text-gray-500">
        My Answers
      </Text>

      {profile?.questions?.length > 0 ? (
        profile.questions.map((item, index) => (
          <View key={index} className="mb-4">
            <Text className="text-black text-2xl font-SatoshiMedium mb-1">
              {item.question}
            </Text>
            <Text className="font-Satoshi text-lg text-gray-700">
              {item.answer}
            </Text>
          </View>
        ))
      ) : (
        <Text className="text-gray-400 italic">No answers yet.</Text>
      )}
      <TouchableOpacity>
        <View className="flex-row justify-between items-center">
          <Text className="font-SatoshiBold text-primary text-lg">
            Add a question...
          </Text>
          <View className="w-6 h-6 rounded-full bg-primary items-center justify-center">
            <Plus size={14} color="#fff" />
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default ProfileAnswers;
