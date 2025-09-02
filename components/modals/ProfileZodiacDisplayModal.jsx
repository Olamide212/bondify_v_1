import { View } from "react-native";
import React, { useState, useEffect } from "react";
import BaseModal from "./BaseModal";
import ModalHeader from "../headers/ModalHeader";
import { FILTER_OPTIONS } from "../../data/filterOptions";
import OptionBox from "../../components/ui/optionBox";

const ProfileDisplayZodiacModal = ({
  visible,
  onClose,
  onSelect,
  initialSelected = null,
}) => {
  const [selectedOption, setSelectedOption] = useState(initialSelected);

  // keep state in sync if profileData changes
  useEffect(() => {
    setSelectedOption(initialSelected);
  }, [initialSelected]);

  return (
    <BaseModal onClose={onClose} visible={visible}>
      <ModalHeader centerText="Zodiac Sign" onClose={onClose} />

      <View className="flex-row flex-wrap p-4">
        {FILTER_OPTIONS.zodiacSign.map((option) => {
          const isSelected = selectedOption === option.value;
          return (
            <OptionBox
              key={option.value}
              label={option.label}
              value={option.value}
              selected={isSelected}
              onPress={() => {
                setSelectedOption(option.value);
                onSelect(option.value); // ✅ update immediately
                onClose(); // ✅ close immediately
              }}
            />
          );
        })}
      </View>
    </BaseModal>
  );
};

export default ProfileDisplayZodiacModal;
