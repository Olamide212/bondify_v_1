// components/modals/ProfileEducationModal.js

import { View } from "react-native";
import React, { useState, useEffect } from "react";
import BaseModal from "./BaseModal";
import ModalHeader from "../headers/ModalHeader";
import OptionBox from "../../components/ui/optionBox";

// Example education options
const EDUCATION_OPTIONS = [
  { label: "High School", value: "high_school" },
  { label: "Associate Degree", value: "associate" },
  { label: "Bachelor's Degree", value: "bachelor" },
  { label: "Master's Degree", value: "master" },
  { label: "Doctorate / PhD", value: "phd" },
  { label: "Trade / Technical", value: "trade" },
  { label: "Other", value: "other" },
];

const ProfileEducationModal = ({
  onClose,
  visible,
  initialSelected = null,
  onSelect,
}) => {
  const [selectedOption, setSelectedOption] = useState(initialSelected);

  useEffect(() => {
    setSelectedOption(initialSelected);
  }, [initialSelected]);

  return (
    <BaseModal onClose={onClose} visible={visible}>
      <ModalHeader centerText="Education" onClose={onClose} />

      <View className="flex-row flex-wrap p-4">
        {EDUCATION_OPTIONS.map((option) => {
          const isSelected = selectedOption === option.value;
          return (
            <OptionBox
              key={option.value}
              label={option.label}
              value={option.value}
              selected={isSelected}
              onPress={() => {
                setSelectedOption(option.value);
                onSelect(option.value);
                onClose();
              }}
            />
          );
        })}
      </View>
    </BaseModal>
  );
};

export default ProfileEducationModal;
