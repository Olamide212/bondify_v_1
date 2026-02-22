import { useEffect, useState } from "react";
import { View } from "react-native";
import OptionBox from "../../components/ui/optionBox";
import { useLookupOptions } from "../../hooks/useLookupOptions";
import ModalHeader from "../headers/ModalHeader";
import BaseModal from "./BaseModal";

const EthnicityModal = ({
  onClose,
  visible,
  initialSelected = null,
  onSelect,
}) => {
  const [selectedOption, setSelectedOption] = useState(initialSelected);
  const { options } = useLookupOptions("ethnicities");

  // keep state in sync if profileData changes
  useEffect(() => {
    setSelectedOption(initialSelected);
  }, [initialSelected]);

  return (
    <BaseModal onClose={onClose} visible={visible}>
      <ModalHeader centerText="Ethnicity" onClose={onClose} />

      <View className="flex-row flex-wrap p-4">
        {options.map((option) => {
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
