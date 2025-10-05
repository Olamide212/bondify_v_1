import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const Card = ({ title, items }) => {
  return (
    <View className="bg-white mt-4  rounded-xl">
      {title && (
        <Text className="text-xl font-GeneralSansMedium mb-3">
          {title}
        </Text>
      )}

      {items.map(({ title, description, onPress, icon: RightIcon }, index) => {
        const isLast = index === items.length - 1;

        return (
          <TouchableOpacity
            key={index}
            className={`flex-row items-center justify-between py-4 gap-4 ${
              !isLast ? "border-b border-gray-200" : ""
            }`}
            onPress={onPress}
          >

              {RightIcon ? (
                <RightIcon size={20} color="#ef4444" />
              ) : (
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              )}
            <View className="flex-row items-center gap-3 flex-1">
              <View className="flex-1">
                <Text className="text-xl text-black font-GeneralSansMedium">
                  {title}
                </Text>
                {description && (
                  <Text className="text-lg text-gray-500 font-Satoshi mt-0.5">
                    {description}
                  </Text>
                )}
              </View>

            
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default Card;
