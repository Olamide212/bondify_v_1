import React, { useState } from "react";
import {
  Text,
  TouchableOpacity,
  View,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { colors } from "../../constant/colors";

// Enable animation on Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const AccordionItem = ({ question, children }) => {
  const [open, setOpen] = useState(false);

  const toggleOpen = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen(!open);
  };

  return (
    <View className="mb-3 bg-[#f1f1f1] px-4 py-3 rounded-xl">
      <TouchableOpacity
        onPress={toggleOpen}
        className="flex-row justify-between items-center"
      >
        <Text className="text-white w-[300px] font-OutfitMedium text-lg">
          {question}
        </Text>
        <Feather
          name={open ? "chevron-up" : "chevron-down"}
          size={20}
          color={"#000"}
        />
      </TouchableOpacity>
      {open && <View className="mt-2 text-white">{children}</View>}
    </View>
  );
};

export default AccordionItem;
