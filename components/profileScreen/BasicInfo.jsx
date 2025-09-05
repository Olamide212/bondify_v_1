import React from "react";
import { View, Text } from "react-native";
import { Briefcase, GraduationCap, MapPin } from "lucide-react-native";

const BasicInfo = ({ profile }) => {
  return (
    <View className="px-6 py-4 bg-white mx-4 rounded-2xl mt-4">
      <View className="flex-row items-center mb-1">
        <Text className="text-black text-3xl font-SatoshiBold">
          {profile.name}{" "}
        </Text>
      </View>
      <View className="flex-row items-center mb-1">
        <Text>
          {profile.gender}, {profile.age} years old
        </Text>
      </View>
    </View>
  );
};

export default BasicInfo;
