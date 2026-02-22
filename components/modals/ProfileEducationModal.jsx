// components/modals/ProfileEducationModal.js

import { useEffect, useState } from "react";
import { View } from "react-native";
import OptionBox from "../../components/ui/optionBox";
import { useLookupOptions } from "../../hooks/useLookupOptions";
import ModalHeader from "../headers/ModalHeader";
import BaseModal from "./BaseModal";

const ProfileEducationModal = ({
  onClose,
  visible,
  initialSelected = null,
  onSelect,
}) => {
  const [selectedOption, setSelectedOption] = useState(initialSelected);
  const { options: educationOptions } = useLookupOptions("education");

  useEffect(() => {
    setSelectedOption(initialSelected);
  }, [initialSelected]);

  return (
    <BaseModal onClose={onClose} visible={visible}>
      <ModalHeader centerText="Education" onClose={onClose} />

      <View className="flex-row flex-wrap p-4">
        {educationOptions.map((option) => {
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
