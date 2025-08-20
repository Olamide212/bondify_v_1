import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Settings, ArrowLeft } from "lucide-react-native";
import * as Progress from "react-native-progress";

const UserProfileHeader = ({ progress }) => {
  return (
    <View className="flex-row items-center justify-between p-4 bg-white">
      <ArrowLeft size={24} />
      <View className="flex-1 px-4">
        <Progress.Bar
          progress={progress}
          width={null}
          height={8}
          color="#00C4B3"
          unfilledColor="#E5E7EB"
          borderWidth={0}
          borderRadius={8}
        />
        <Text className="text-xs mt-1">
          {Math.round(progress * 100)}% complete
        </Text>
      </View>
      <TouchableOpacity>
        <Settings size={24} />
      </TouchableOpacity>
    </View>
  );
};

export default UserProfileHeader;
