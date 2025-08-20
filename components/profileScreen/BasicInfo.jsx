import React from "react";
import { View, Text } from "react-native";
import { Briefcase, GraduationCap, MapPin } from "lucide-react-native";

const BasicInfo = ({ job, education, location }) => {
  return (
    <View className="px-4 py-2">
      <Text className="text-lg font-semibold mb-2">Basic Info</Text>
      <View className="flex-row items-center mb-1">
        <Briefcase size={18} className="mr-2" />
        <Text>{job}</Text>
      </View>
      <View className="flex-row items-center mb-1">
        <GraduationCap size={18} className="mr-2" />
        <Text>{education}</Text>
      </View>
      <View className="flex-row items-center">
        <MapPin size={18} className="mr-2" />
        <Text>{location}</Text>
      </View>
    </View>
  );
};

export default BasicInfo;
