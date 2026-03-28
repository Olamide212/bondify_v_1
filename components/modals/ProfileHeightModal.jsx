import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ModalHeader from "../headers/ModalHeader";
import BaseModal from "./BaseModal";

const HEIGHT_OPTIONS = Array.from({ length: 151 }, (_, i) => ({
  value: i + 100,
  label: `${i + 100} cm`,
}));

const ProfileHeightModal = ({
  visible,
  onClose,
  onSelect,
  initialSelected = null,
}) => {
  const [selectedOption, setSelectedOption] = useState(initialSelected);

  useEffect(() => {
    setSelectedOption(initialSelected);
  }, [initialSelected]);

  return (
    <BaseModal onClose={onClose} visible={visible} fullScreen>
      <View style={styles.container}>
        <ModalHeader centerText="Height" onClose={onClose} />

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {HEIGHT_OPTIONS.map((option) => {
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

export default ProfileHeightModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  option: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  optionSelected: {
    backgroundColor: '#111',
    borderColor: '#111',
  },
  optionText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSansMedium',
    color: '#111',
    textAlign: 'center',
  },
  optionTextSelected: {
    color: '#fff',
  },
});
