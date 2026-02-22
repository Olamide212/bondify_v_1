// components/inputs/CheckboxSelect.jsx
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../constant/colors";

const CheckboxSelect = ({
  label,
  options = [],
  value = [],
  onChange,
  error,
  horizontal = false,
  className = "",
}) => {
  const toggleSelection = (optionValue) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

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
            className={`flex-row items-center justify-between gap-2  px-4 rounded-xl border border-[#dadada] ${className}`}
            onPress={() => toggleSelection(option.value)}
            style={{ height: 50, borderRadius: 10 }}
          >
            <Text className="text-app text-lg font-SatoshiMedium">
              {option.label}
            </Text>
            <Ionicons
              name={
                value.includes(option.value) ? "checkbox" : "square-outline"
              }
              size={20}
              color={value.includes(option.value) ? colors.primary : "#A4A4A4"}
            />
          </TouchableOpacity>
        ))}
      </View>
      {error && <Text className="text-red-500 text-xs mt-1">{error}</Text>}
    </View>
  );
};

export default CheckboxSelect;
