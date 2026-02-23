import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Bot, Send } from "lucide-react-native";
import { colors } from "../../../../constant/colors";
import GeneralHeader from "../../../../components/headers/GeneralHeader";

// Recommendation: Integrate OpenAI GPT-4o API for best AI chat experience.
// Alternative: Google Gemini API — great for multi-modal and cost-effective usage.

const AIChatScreen = () => {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const scrollViewRef = useRef(null);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 1,
          text: "Hi there! I'm BonBot, your personal dating assistant. I can help you find better matches, suggest ice breakers, and give dating advice. How can I help you today?",
          isUser: false,
          timestamp: new Date(),
        },
      ]);
    }
  }, []);

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (userInput.trim() === "") return;

    const newUserMessage = {
      id: Date.now(),
      text: userInput,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setUserInput("");

    // TODO: Replace with actual LLM API call (OpenAI GPT-4o or Google Gemini)
    setTimeout(() => {
      const aiResponses = [
        "Based on your preferences, I'd recommend focusing on profiles that share your interest in hiking and outdoor activities.",
        "I've noticed you tend to like profiles with similar educational backgrounds. Should I prioritize showing you more profiles from that criteria?",
        "Your match preferences are being updated. I'll show you more profiles that align with what you're looking for.",
        "That's helpful information! I'm learning more about what you like in a partner.",
        "I can help you refine your search criteria. Would you like me to adjust any specific filters?",
        "Here's a great ice breaker you could try: 'If you could travel anywhere tomorrow, where would you go and why?'",
        "Try asking about their favorite weekend activity — it's a natural conversation starter!",
      ];

      const randomResponse =
        aiResponses[Math.floor(Math.random() * aiResponses.length)];

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: randomResponse,
          isUser: false,
          timestamp: new Date(),
        },
      ]);
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <GeneralHeader title="AI Chat" />

      <View style={styles.botBanner}>
        <Bot size={20} color={colors.primary} />
        <Text style={styles.botBannerText}>
          Powered by BonBot — your dating AI assistant
        </Text>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageBubble,
              message.isUser ? styles.userMessage : styles.aiMessage,
            ]}
          >
            {!message.isUser && (
              <View style={styles.botIcon}>
                <Bot size={16} color={colors.primary} />
              </View>
            )}
            <Text
              style={
                message.isUser ? styles.userMessageText : styles.aiMessageText
              }
            >
              {message.text}
            </Text>
            <Text style={[styles.timestamp, message.isUser && { color: "rgba(255,255,255,0.7)" }]}>
              {message.timestamp.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
        ))}
      </ScrollView>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={90}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={userInput}
            onChangeText={setUserInput}
            placeholder="Ask BonBot anything..."
            placeholderTextColor="#999"
            multiline
          />
          <Pressable
            onPress={handleSendMessage}
            style={[
              styles.sendButton,
              userInput.trim() !== "" && styles.sendButtonActive,
            ]}
            disabled={userInput.trim() === ""}
          >
            <Send
              size={20}
              color={userInput.trim() === "" ? "#ccc" : "#fff"}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  botBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 8,
    backgroundColor: "#FFF8F5",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  botBannerText: {
    fontSize: 13,
    color: "#666",
    fontFamily: "Satoshi",
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 100,
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
  botIcon: {
    marginBottom: 4,
  },
  userMessageText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Satoshi",
  },
  aiMessageText: {
    color: "#000",
    fontSize: 16,
    fontFamily: "Satoshi",
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
    paddingBottom: 30,
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
    fontFamily: "Satoshi",
  },
  sendButton: {
    padding: 12,
    borderRadius: 24,
    backgroundColor: "#f0f0f0",
  },
  sendButtonActive: {
    backgroundColor: colors.primary,
  },
});

export default AIChatScreen;
