import React, { useState } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { RotateCcw } from "lucide-react-native";

const SuggestionModal = ({
  visible,
  onClose,
  suggestions = [],
  onSelectSuggestion,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleReload = () => {
    setCurrentIndex((prev) => (prev + 1) % suggestions.length);
  };

  const handlePick = () => {
    onSelectSuggestion(suggestions[currentIndex]);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.modalContent}>
          <Text style={styles.suggestionText}>{suggestions[currentIndex]}</Text>

          <View style={styles.actions}>
            <TouchableOpacity onPress={handleReload} style={styles.reloadBtn}>
              <RotateCcw size={22} color="#3B82F6" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handlePick} style={styles.pickBtn}>
              <Text style={styles.pickBtnText}>Use this</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  suggestionText: {
    fontSize: 18,
    marginBottom: 16,
    textAlign: "center",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  reloadBtn: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
  },
  pickBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: "#3B82F6",
  },
  pickBtnText: {
    color: "white",
    fontWeight: "500",
  },
});

export default SuggestionModal;
