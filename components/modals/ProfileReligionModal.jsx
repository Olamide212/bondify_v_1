import { View } from "react-native";
import React, { useState, useEffect } from "react";
import BaseModal from "./BaseModal";
import ModalHeader from "../headers/ModalHeader";
import OptionBox from "../../components/ui/optionBox";
import { FILTER_OPTIONS } from "../../data/filterOptions"; 

const ProfileReligionModal = ({
  visible,
  onClose,
  initialSelected = null,
  onSelect,
}) => {
  const [selectedOption, setSelectedOption] = useState(initialSelected);

  // keep state synced if profileData changes
  useEffect(() => {
    setSelectedOption(initialSelected);
  }, [initialSelected]);

  return (
    <BaseModal onClose={onClose} visible={visible}>
      <ModalHeader centerText="Religion" onClose={onClose} />

      <View className="flex-row flex-wrap p-4">
        {FILTER_OPTIONS.religion.map((option) => {
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
                onClose(); // ✅ close modal
              }}
            />
          );
        })}
      </View>
    </BaseModal>
  );
};

export default ProfileReligionModal;
