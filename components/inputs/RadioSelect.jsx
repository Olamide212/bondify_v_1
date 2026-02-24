// components/inputs/RadioSelect.jsx
import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

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
        <Text className="text-lg font-PlusJakartaSansMedium mb-2">{label}</Text>
      )}
      <View
        className={`flex ${horizontal ? "flex-row flex-wrap gap-4" : "flex-col gap-3"}`}
      >
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            className={`px-5 py-5 rounded-2xl border-2  ${className}
               ${value === option.value ? "border-primary bg-primary/10" : "border-[#dadada]"}`}
            onPress={() => onChange(option.value)}
            style={{ borderRadius: 10 }}
          >
            <View className="flex-row justify-between items-center">
              <View className="flex-1 pr-4">
                <Text
                  className={`text-app text-[16px] font-PlusJakartaSansBold 
                  ${value === option.value ? "text-black" : ""} `}
                  style={{ flexWrap: "wrap" }}
                >
                  {option.label}
                </Text>
                {!!option.description && (
                  <Text className="text-black text-base font-PlusJakartaSans mt-1">
                    {option.description}
                  </Text>
                )}
              </View>
              <Ionicons
                name={
                  value === option.value
                    ? "radio-button-on"
                    : "radio-button-off"
                }
                size={20}
                color={value === option.value ? "#EE5F2B" : "#A4A4A4"}
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
