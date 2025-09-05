// components/OptionBox.jsx
import { View, Text, TouchableOpacity } from "react-native";
import { colors } from "../../constant/colors";

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
        padding: 10,
        borderWidth: 1,
        borderRadius: 8,
        margin: 5,
        backgroundColor: isActive ? colors.primary : "#fff",
      }}
    >
      <Text
        style={{
          color: isActive ? "#fff" : "#333",
          fontFamily: "GeneralSansSemiBold",
        }}
      >
        {label || value}
      </Text>
    </TouchableOpacity>
  );
}
