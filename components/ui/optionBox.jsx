// components/OptionBox.jsx
import { View, Text, TouchableOpacity } from "react-native";
import { colors } from "../../constant/colors";
import { fonts } from "../../constant/fonts";

export default function OptionBox({
  label,
  value,
  selected,
  onPress,
  readOnly,
}) {
  const isActive = selected && !readOnly;

  return (
    <TouchableOpacity
      disabled={readOnly}
      onPress={onPress}
      style={{
        padding: 12,
        borderRadius:  8,
        margin: 5,
        backgroundColor: isActive ? colors.primary : "#f1f1f1",
      }}
    >
      <Text
        style={{
          color: isActive ? "#fff" : "#333",
          fontFamily: fonts.PlusJakartaSansMedium,
        }}
      >
        {label || value}
      </Text>
    </TouchableOpacity>
  );
}
