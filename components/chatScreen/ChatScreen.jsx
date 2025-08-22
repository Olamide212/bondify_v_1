// components/ChatScreen.js
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  ScrollView,
  Text,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { initialMessages } from "../../data/mockData";
import Header from "../headers/ChatHeader";
import MessageBubble from "./MessageBubble";
import InputToolbar from "./InputToolbar";
import { formatRelativeDate } from "../../utils/helper";
import { SafeAreaView } from "react-native-safe-area-context";


const ChatScreen = ({ matchedUser, onBack }) => {
  const [messages, setMessages] = useState(initialMessages);
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    const typingTimer = setTimeout(() => {
      setIsTyping(Math.random() > 0.7);
    }, 3000);
    return () => clearTimeout(typingTimer);
  }, [messages]);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const sendMessage = (text, imageUrl, voiceNote) => {
    if (!text && !imageUrl && !voiceNote) return;
    const newMessage = {
      id: Date.now().toString(),
      text,
      imageUrl,
      voiceNote,
      voiceDuration: voiceNote ? Math.floor(Math.random() * 30) + 5 : undefined,
      timestamp: new Date(),
      sender: "me",
      status: "sent",
      type: imageUrl ? "image" : voiceNote ? "voice" : "text",
    };
    setMessages((prev) => [...prev, newMessage]);

    // Simulate message delivery and read status
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === newMessage.id ? { ...msg, status: "delivered" } : msg
        )
      );
    }, 1000);

    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === newMessage.id ? { ...msg, status: "read" } : msg
        )
      );
    }, 3000);
  };

  if (!matchedUser) return null;

  return (
    <SafeAreaView className='flex-1'>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Header matchedUser={matchedUser} onBack={onBack} />

        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: true })
          }
        >
          <View style={styles.matchBanner}>
            <View style={styles.bannerContent}>
              <Text style={styles.bannerText}>
                You matched with {matchedUser.name}{" "}
                {formatRelativeDate(matchedUser.matchedDate)}
              </Text>
            </View>
          </View>

          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {isTyping && (
            <View
              style={[
                styles.messageBubbleContainer,
                styles.theirMessageContainer,
              ]}
            >
              <View style={[styles.messageBubble, styles.theirMessageBubble]}>
                <Text style={[styles.messageText, styles.theirMessageText]}>
                  Typing...
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        <InputToolbar sendMessage={sendMessage} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  messagesContent: {
    paddingVertical: 16,
  },
  matchBanner: {
    alignItems: "center",
    marginBottom: 16,
  },
  bannerContent: {
    backgroundColor: "#FCE7F3",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  bannerText: {
    color: "#EC4899",
    fontSize: 12,
  },
  messageBubbleContainer: {
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  theirMessageContainer: {
    alignItems: "flex-start",
  },
  messageBubble: {
    maxWidth: "80%",
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  theirMessageBubble: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  messageText: {
    fontSize: 16,
  },
  theirMessageText: {
    color: "#1F2937",
  },
});

export default ChatScreen;
