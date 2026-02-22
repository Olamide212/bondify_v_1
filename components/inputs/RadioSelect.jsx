// components/inputs/RadioSelect.jsx
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const RadioSelect = ({
  label,
  options = [],
  value,
  onChange,
  error,
  horizontal = false,
  className = "",
}) => {
  return (
    <View className={`mb-4 w-full ${className}`}>
      {label && (
        <Text className="text-lg font-SatoshiMedium mb-2">{label}</Text>
      )}
      <View
        className={`flex ${horizontal ? "flex-row flex-wrap gap-4" : "flex-col gap-3"}`}
      >
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            className={`px-4 py-3 rounded-xl border  ${className}
               ${value === option.value ? "border-primary" : "border-[#dadada]"}`}
            onPress={() => onChange(option.value)}
            style={{ borderRadius: 10 }}
          >
            <View className="flex-row justify-between items-center">
              <Text
                className={`text-app text-lg font-SatoshiMedium flex-1 pr-4 
                  ${value === option.value ? "text-primary" : ""} `}
                style={{ flexWrap: "wrap" }}
              >
                {option.label}
              </Text>
              <Ionicons
                name={
                  value === option.value
                    ? "radio-button-on"
                    : "radio-button-off"
                }
                size={20}
                color={value === option.value ? "#5A56D0" : "#A4A4A4"}
              />
            </View>
          </TouchableOpacity>
        ))}
      </View>
      {error && <Text className="text-red-500 text-xs mt-1">{error}</Text>}
    </View>
  );
};

export default RadioSelect;
