import React from "react";
import { View, Text, Pressable, TouchableOpacity } from "react-native";
import { Briefcase, GraduationCap, MapPin } from "lucide-react-native";

const Verification = ({ profile }) => {
    return (
      <TouchableOpacity className="px-6 py-4 bg-white mx-4 rounded-2xl mb-4">
        <Text className="mb-2 font-SatoshiMedium text-lg text-gray-500 ">
          Verification
        </Text>
        <View className=" mb-1">
          <Text className="text-black text-2xl font-SatoshiMedium">
            Become a verified user{" "}
          </Text>
          <Text className="flex-1 font-Satoshi text-lg">
            Verify your identity with a quick selfie and get your badge
          </Text>
        </View>
      </TouchableOpacity>
    );
};

export default Verification;
