import { View, Text, TouchableOpacity } from "react-native";
import React, { useState } from "react";
import BaseModal from "./BaseModal";
import ModalHeader from "../headers/ModalHeader";
import { FILTER_OPTIONS } from "../../data/filterOptions";


const ReligionModal = ({
  onClose,
  visible,
  initialSelected = null,
  onApply,
}) => {
  const [selectedOption, setSelectedOption] = useState(initialSelected);

  return (
    <BaseModal onClose={onClose} visible={visible}>
      <ModalHeader
        centerText="Religion"
        rightText="Apply"
        onClose={onClose}
        onRightPress={() => {
          onApply(selectedOption);
          onClose();
        }}
      />

      <View className="p-4">
        {FILTER_OPTIONS.religion.map((option) => {
          const isSelected = selectedOption === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              onPress={() => setSelectedOption(option.value)}
              className={`py-3 px-3 border-b border-gray-200 ${
                isSelected ? "bg-primary/10" : ""
              }`}
            >
              <Text
                className={`text-[16px] font-SatoshiMedium ${
                  isSelected ? "text-primary" : "text-black"
                }`}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </BaseModal>
  );
};

export default ReligionModal;
