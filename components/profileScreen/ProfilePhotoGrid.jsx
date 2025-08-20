import React from "react";
import { View, Image, TouchableOpacity, Text } from "react-native";
import { X } from "lucide-react-native";

const ProfilePhotoGrid = ({ photos }) => {
  return (
    <View className="p-4">
      <View className="flex-row flex-wrap gap-2">
        {photos.map((uri, idx) => (
          <View
            key={idx}
            className="relative w-[30%] aspect-square rounded-xl overflow-hidden"
          >
            <Image source={{ uri }} className="w-full h-full" />
            <TouchableOpacity className="absolute top-1 right-1 bg-black/50 p-1 rounded-full">
              <X size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
      <TouchableOpacity className="bg-teal-500 rounded-lg p-3 mt-4 items-center">
        <Text className="text-white font-semibold">Add Photos or Videos</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ProfilePhotoGrid;
