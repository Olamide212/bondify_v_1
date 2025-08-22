import React from "react";
import { View, Text, Pressable, TouchableOpacity } from "react-native";
import { Briefcase, GraduationCap, MapPin } from "lucide-react-native";

const AboutMe = ({ profile }) => {
    return (
      <TouchableOpacity className="px-6 py-4 bg-white mx-4 rounded-2xl mt-4">
        <Text className="mb-2 font-SatoshiMedium text-lg text-gray-500 ">
          About me
        </Text>
        <View className=" mb-1">
          <Text className="text-black text-xl font-SatoshiMedium">
            {profile.bio}
          </Text>
        
        </View>
      </TouchableOpacity>
    );
};

export default AboutMe;
