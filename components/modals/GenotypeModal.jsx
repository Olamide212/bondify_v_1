import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import OptionBox from "../../components/ui/optionBox";
import { useLookupOptions } from "../../hooks/useLookupOptions";
import ModalHeader from "../headers/ModalHeader";
import BaseModal from "./BaseModal";

const GenotypeModal = ({
  onClose,
  visible,
  initialSelected = null,
  onSelect,
}) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const { options, loading } = useLookupOptions("genotype");

  // Sync selected value whenever modal opens or initialSelected changes
  useEffect(() => {
    if (visible && initialSelected) {
      const trimmed = String(initialSelected).trim();
      setSelectedOption(trimmed);
      console.log('[GenotypeModal] Selected:', trimmed, 'Options:', options.map(o => o.value));
    } else if (visible && !initialSelected) {
      setSelectedOption(null);
    }
  }, [visible, initialSelected, options]);

  return (
    <BaseModal onClose={onClose} visible={visible}>
      <ModalHeader centerText="Genotype" onClose={onClose} />

      {loading ? (
        <Text style={{ padding: 16, textAlign: 'center' }}>Loading options...</Text>
      ) : (
        <View className="flex-row flex-wrap p-4">
          {options && options.length > 0 ? (
            options.map((option) => {
              const optionValueTrimmed = String(option.value).trim();
              const isSelected = selectedOption === optionValueTrimmed || selectedOption === option.value;
              return (
                <OptionBox
                  key={option.value}
                  label={option.label}
                  value={option.value}
                  selected={isSelected}
                  onPress={() => {
                    setSelectedOption(optionValueTrimmed);
                    onSelect(option.value);
                    onClose();
                  }}
                />
              );
            })
          ) : (
            <Text style={{ padding: 16 }}>No options available</Text>
          )}
        </View>
      )}
    </BaseModal>
  );
};

export default GenotypeModal;
