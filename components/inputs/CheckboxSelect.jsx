// components/inputs/CheckboxSelect.jsx
import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";
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
        <Text className="text-lg font-PlusJakartaSansMedium mb-2">{label}</Text>
      )}
      <View
        className={`flex ${horizontal ? "flex-row flex-wrap gap-4" : "flex-col gap-3"}`}
      >
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            className={`flex-row items-center justify-between gap-2 px-5 py-5 rounded-2xl border-[1px]  ${className}
               ${value.includes(option.value) ? "border-primary bg-primary/10" : "border-whiteLight bg-whiteLight"}`}
            onPress={() => toggleSelection(option.value)}
            style={{ borderRadius: 10 }}
          >
            <View style={{flex: 1}} className="pr-2">
              <Text className="text-white text-xl font-PlusJakartaSansBold">
                {option.label}
              </Text>
              {!!option.description && (
                <Text className="text-white text-base font-PlusJakartaSans mt-1">
                  {option.description}
                </Text>
              )}
            </View>
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
