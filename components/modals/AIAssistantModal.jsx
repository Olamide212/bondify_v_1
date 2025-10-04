// components/modals/AIAssistantModal.js
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { Bot, Send, X } from "lucide-react-native";
import BaseModal from "./BaseModal";
import { colors } from "../../constant/colors";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

const AIAssistantModal = ({ visible, onClose }) => {
  const [aiMessages, setAiMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const scrollViewRef = useRef(null);

  // Initialize with a welcome message when modal opens
  useEffect(() => {
    if (visible && aiMessages.length === 0) {
      setAiMessages([
        {
          id: 1,
          text: "Hi there! I am BonBot your personal dating assistant. I can help you find better matches based on your preferences. What are you looking for in a partner?",
          isUser: false,
          timestamp: new Date(),
        },
      ]);
    }
  }, [visible]);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [aiMessages]);

  const handleSendMessage = () => {
    if (userInput.trim() === "") return;

    const newUserMessage = {
      id: Date.now(),
      text: userInput,
      isUser: true,
      timestamp: new Date(),
    };

    setAiMessages((prev) => [...prev, newUserMessage]);
    setUserInput("");

    // Simulate AI response
    setTimeout(() => {
      const aiResponses = [
        "Based on your preferences, I'd recommend focusing on profiles that share your interest in hiking and outdoor activities.",
        "I've noticed you tend to like profiles with similar educational backgrounds. Should I prioritize showing you more profiles from that criteria?",
        "Your match preferences are being updated. I'll show you more profiles that align with what you're looking for.",
        "That's helpful information! I'm learning more about what you like in a partner.",
        "I can help you refine your search criteria. Would you like me to adjust any specific filters?",
        "Based on your swiping patterns, I'm noticing you prefer creative types. Would you like me to highlight more artists and designers?",
      ];

      const randomResponse =
        aiResponses[Math.floor(Math.random() * aiResponses.length)];

      const newAiMessage = {
        id: Date.now() + 1,
        text: randomResponse,
        isUser: false,
        timestamp: new Date(),
      };

      setAiMessages((prev) => [...prev, newAiMessage]);
    }, 1000);
  };

  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      animationType="slide"
      fullScreen={true}
    >
      <SafeAreaProvider>
      <SafeAreaView style={styles.aiModalContainer} >
        {/* Header */}
        <View style={styles.aiHeader}>
          <View style={styles.aiTitleContainer}>
            <Bot size={24} color={colors.primary} />
            <Text style={styles.aiTitle}>BonBot</Text>
          </View>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#000" />
          </Pressable>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
        >
          {aiMessages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageBubble,
                message.isUser ? styles.userMessage : styles.aiMessage,
              ]}
            >
              <Text
                style={
                  message.isUser ? styles.userMessageText : styles.aiMessageText
                }
              >
                {message.text}
              </Text>
              <Text style={styles.timestamp}>
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* Input Area */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={80}
        >
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={userInput}
              onChangeText={setUserInput}
              placeholder="Ask about preferences or matches..."
              placeholderTextColor="#999"
              multiline
            />
            <Pressable
              onPress={handleSendMessage}
              style={styles.sendButton}
              disabled={userInput.trim() === ""}
            >
              <Send
                size={20}
                color={userInput.trim() === "" ? "#ccc" : colors.primary}
              />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
        </SafeAreaView>
        </SafeAreaProvider>
    </BaseModal>
  );
};

const styles = StyleSheet.create({
  aiModalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  aiHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  aiTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  aiTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  closeButton: {
    padding: 4,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 80,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 18,
    marginBottom: 12,
  },
  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  aiMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    borderBottomLeftRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userMessageText: {
    color: "#fff",
    fontSize: 16,
  },
  aiMessageText: {
    color: "#000",
    fontSize: 16,
  },
  timestamp: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
    alignSelf: "flex-end",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    backgroundColor: "#fff",
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
  },
});

export default AIAssistantModal;
