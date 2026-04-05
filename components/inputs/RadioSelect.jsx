// components/inputs/RadioSelect.jsx
import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";
import { colors } from "../../constant/colors";

const RadioSelect = ({
  label,
  options = [],
  value,
  values = [], // For multiple selections
  onChange,
  onMultiChange, // For multiple selections
  error,
  horizontal = false,
  multiSelect = false, // New prop to enable multiple selections
  className = "",
}) => {
  const handlePress = (optionValue) => {
    if (multiSelect && onMultiChange) {
      if (values.includes(optionValue)) {
        // Remove if already selected
        onMultiChange(values.filter(v => v !== optionValue));
      } else {
        // Add if not selected
        onMultiChange([...values, optionValue]);
      }
    } else if (onChange) {
      onChange(optionValue);
    }
  };

  const isSelected = (optionValue) => {
    if (multiSelect) {
      return values.includes(optionValue);
    }
    return value === optionValue;
  };

  return (
    <View className={`mb-4 w-full ${className}`}>
      {label && (
        <Text className="text-lg font-OutfitMedium text-white mb-2">{label}</Text>
      )}
      <View
        className={`flex ${horizontal ? "flex-row flex-wrap gap-4" : "flex-col gap-3"}`}
      >
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            className={`px-5 py-5   rounded-2xl border-[1px]  ${className}
               ${isSelected(option.value) ? "border-primary bg-primary/10" : "bg-whiteLight border-whiteLight"}`}
            onPress={() => handlePress(option.value)}
            style={{ borderRadius: 10 }}
          >
            <View className="flex-row justify-between items-center">
              <View style={{flex: 1}} className="pr-4">
                <Text
                  className={`text-white text-[16px] font-OutfitBold 
                  ${isSelected(option.value) ? "text-white" : ""} `}
                  style={{ flexWrap: "wrap" }}
                >
                  {option.label}
                </Text>
                {!!option.description && (
                  <Text className="text-white text-base font-Outfit mt-1">
                    {option.description}
                  </Text>
                )}
              </View>
              <Ionicons
                name={
                  isSelected(option.value)
                    ? (multiSelect ? "checkbox" : "radio-button-on")
                    : (multiSelect ? "square-outline" : "radio-button-off")
                }
                size={20}
                color={isSelected(option.value) ? colors.primary : "#A4A4A4"}
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
