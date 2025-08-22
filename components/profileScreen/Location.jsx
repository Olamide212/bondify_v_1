import React from "react";
import { View, Text, Pressable, TouchableOpacity } from "react-native";
import { Briefcase, GraduationCap, MapPin } from "lucide-react-native";

const Location = ({ profile }) => {
    return (
      <TouchableOpacity className="px-6 py-4 bg-white mx-4 rounded-2xl mt-4">
        <Text className="mb-2 font-SatoshiMedium text-lg text-gray-500 ">
          Location
        </Text>
        <View className=" mb-1">
          <Text className="text-black text-2xl font-SatoshiMedium">
        {profile.location}
          </Text>
            <Text className="flex-1  text-lg text-primary font-SatoshiMedium">
                            
                    Change your location
                  </Text>
        </View>
      </TouchableOpacity>
    );
};

export default Location;
