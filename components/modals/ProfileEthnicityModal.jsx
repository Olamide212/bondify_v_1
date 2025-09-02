import { View } from "react-native";
import React, { useState, useEffect } from "react";
import BaseModal from "./BaseModal";
import ModalHeader from "../headers/ModalHeader";
import { ETHNICITY_OPTIONS } from "../../data/ethnicityData";
import OptionBox from "../../components/ui/optionBox";

const EthnicityModal = ({
  onClose,
  visible,
  initialSelected = null,
  onSelect,
}) => {
  const [selectedOption, setSelectedOption] = useState(initialSelected);

  // keep state in sync if profileData changes
  useEffect(() => {
    setSelectedOption(initialSelected);
  }, [initialSelected]);

  return (
    <BaseModal onClose={onClose} visible={visible}>
      <ModalHeader centerText="Ethnicity" onClose={onClose} />

      <View className="flex-row flex-wrap p-4">
        {ETHNICITY_OPTIONS.map((option) => {
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

export default EthnicityModal;
