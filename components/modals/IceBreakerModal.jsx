import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
} from "react-native";
import { Send, Shuffle, X } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BaseModal from "./BaseModal";
import { colors } from "../../constant/colors";
import { ICE_BREAKERS } from "../../constant/iceBreakers";

const IceBreakerModal = ({ visible, onClose, onSend }) => {
  const [selectedIceBreaker, setSelectedIceBreaker] = useState("");
  const [customMessage, setCustomMessage] = useState("");

  const shuffleIceBreaker = () => {
    const random =
      ICE_BREAKERS[
        Math.floor(Math.random() * ICE_BREAKERS.length)
      ];
    setSelectedIceBreaker(random);
    setCustomMessage("");
  };

  const handleSend = () => {
    const message = customMessage.trim() || selectedIceBreaker;
    if (message) {
      onSend?.(message);
      setCustomMessage("");
      setSelectedIceBreaker("");
      onClose?.();
    }
  };

  return (
    <BaseModal visible={visible} onClose={onClose} fullScreen>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Send Ice Breaker</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#000" />
          </Pressable>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentInner}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.subtitle}>
            Break the ice with a fun question or write your own message
          </Text>

          {/* Suggestions */}
          <View style={styles.suggestionsContainer}>
            <View style={styles.suggestionsHeader}>
              <Text style={styles.sectionLabel}>Suggestions</Text>
              <Pressable onPress={shuffleIceBreaker} style={styles.shuffleButton}>
                <Shuffle size={16} color={colors.primary} />
                <Text style={styles.shuffleText}>Shuffle</Text>
              </Pressable>
            </View>

            {ICE_BREAKERS.slice(0, 5).map((iceBreaker, index) => (
              <Pressable
                key={index}
                style={[
                  styles.suggestionItem,
                  selectedIceBreaker === iceBreaker && styles.selectedSuggestion,
                ]}
                onPress={() => {
                  setSelectedIceBreaker(iceBreaker);
                  setCustomMessage("");
                }}
              >
                <Text
                  style={[
                    styles.suggestionText,
                    selectedIceBreaker === iceBreaker && styles.selectedSuggestionText,
                  ]}
                >
                  {iceBreaker}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Custom message */}
          <View style={styles.customContainer}>
            <Text style={styles.sectionLabel}>Or write your own</Text>
            <TextInput
              style={styles.customInput}
              value={customMessage}
              onChangeText={(text) => {
                setCustomMessage(text);
                setSelectedIceBreaker("");
              }}
              placeholder="Type your ice breaker message..."
              placeholderTextColor="#999"
              multiline
              maxLength={200}
            />
          </View>
        </ScrollView>

        {/* Send button */}
        <View style={styles.footer}>
          <Pressable
            style={[
              styles.sendButton,
              !(customMessage.trim() || selectedIceBreaker) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!(customMessage.trim() || selectedIceBreaker)}
          >
            <Send size={20} color="#fff" />
            <Text style={styles.sendButtonText}>Send Ice Breaker</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </BaseModal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  title: {
    fontSize: 20,
    fontFamily: "PlusJakartaSansBold",
    color: "#000",
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: 20,
    paddingBottom: 40,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "PlusJakartaSans",
    color: "#666",
    marginBottom: 24,
    lineHeight: 22,
  },
  suggestionsContainer: {
    marginBottom: 24,
  },
  suggestionsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 16,
    fontFamily: "PlusJakartaSansBold",
    color: "#000",
  },
  shuffleButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#FFF8F5",
  },
  shuffleText: {
    fontSize: 14,
    fontFamily: "PlusJakartaSansMedium",
    color: colors.primary,
  },
  suggestionItem: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#f8f8f8",
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  selectedSuggestion: {
    borderColor: colors.primary,
    backgroundColor: "#FFF8F5",
  },
  suggestionText: {
    fontSize: 15,
    fontFamily: "PlusJakartaSans",
    color: "#333",
    lineHeight: 22,
  },
  selectedSuggestionText: {
    color: colors.primary,
  },
  customContainer: {
    marginBottom: 20,
  },
  customInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
    minHeight: 80,
    fontSize: 15,
    fontFamily: "PlusJakartaSans",
    textAlignVertical: "top",
    color: "#000",
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    backgroundColor: "#fff",
  },
  sendButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 30,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "PlusJakartaSansSemiBold",
  },
});

export default IceBreakerModal;
