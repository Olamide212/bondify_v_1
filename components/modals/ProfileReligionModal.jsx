import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useLookupOptions } from "../../hooks/useLookupOptions";
import ModalHeader from "../headers/ModalHeader";
import BaseModal from "./BaseModal";
import { colors } from "../../constant/colors";

const ProfileReligionModal = ({
  visible,
  onClose,
  initialSelected = null,
  onSelect,
}) => {
  const [selectedOption, setSelectedOption] = useState(initialSelected);
  const { options } = useLookupOptions("religions");

  useEffect(() => {
    setSelectedOption(initialSelected);
  }, [initialSelected]);

  return (
    <BaseModal onClose={onClose} visible={visible} fullScreen>
      <View style={styles.container}>
        <ModalHeader centerText="Religion" onClose={onClose} />

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {options.map((option) => {
            const isSelected = selectedOption === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.option, isSelected && styles.optionSelected]}
                onPress={() => {
                  setSelectedOption(option.value);
                  onSelect(option.value);
                  onClose();
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </BaseModal>
  );
};

export default ProfileReligionModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  option: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 50,
    marginBottom: 8,
    backgroundColor: colors.whiteLight,
    borderWidth: 1,
    borderColor: colors.whiteLight,
  },
  optionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    fontSize: 16,
    fontFamily: 'OutfitMedium',
    color: '#E5E5E5',
    textAlign: 'center',
  },
  optionTextSelected: {
    color: '#fff',
  },
});
