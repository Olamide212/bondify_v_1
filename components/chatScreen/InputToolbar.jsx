// components/InputToolbar.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
} from "react-native";
import { Send, Smile, Camera, Mic } from "lucide-react-native";

const InputToolbar = ({ sendMessage }) => {
  const [messageText, setMessageText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const emojis = [
    "😊",
    "😂",
    "❤️",
    "😍",
    "🥰",
    "😘",
    "👍",
    "🔥",
    "💯",
    "🎉",
    "🌟",
    "💖",
  ];

  const handleImagePicker = () => {
    Alert.alert("Send Image", "Choose an option", [
      {
        text: "Camera",
        onPress: () =>
          sendMessage(
            undefined,
            "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop"
          ),
      },
      {
        text: "Gallery",
        onPress: () =>
          sendMessage(
            undefined,
            "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=300&fit=crop"
          ),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  // const handleVoiceNote = () => {
  //   if (isRecording) {
  //     setIsRecording(false);
  //     sendMessage(undefined, undefined, true);
  //   } else {
  //     setIsRecording(true);
  //     setTimeout(() => {
  //       setIsRecording(false);
  //       sendMessage(undefined, undefined, true);
  //     }, 2000);
  //   }
  // };

  const handleSend = () => {
    if (messageText.trim()) {
      sendMessage(messageText);
      setMessageText("");
      setShowEmojiPicker(false);
    }
  };

  return (
    <View style={styles.container}>
      {showEmojiPicker && (
        <View style={styles.emojiPicker}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {emojis.map((emoji, index) => (
              <TouchableOpacity
                key={index}
                style={styles.emojiButton}
                onPress={() => setMessageText((prev) => prev + emoji)}
              >
                <Text style={styles.emoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <TouchableOpacity
        style={styles.iconButton}
        onPress={() => setShowEmojiPicker(!showEmojiPicker)}
      >
        <Smile color="#6B7280" />
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Type a message..."
        value={messageText}
        onChangeText={setMessageText}
        multiline
      />

      {messageText ? (
        <TouchableOpacity style={styles.iconButton} onPress={handleSend}>
          <Send color="#EC4899" />
        </TouchableOpacity>
      ) : (
        <View style={styles.mediaButtons}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleImagePicker}
          >
            <Camera color="#6B7280" />
          </TouchableOpacity>
          
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  emojiPicker: {
    position: "absolute",
    bottom: 60,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingVertical: 8,
  },
  emojiButton: {
    padding: 8,
  },
  emoji: {
    fontSize: 24,
  },
  iconButton: {
    padding: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 16,
    maxHeight: 100,
    fontSize: 16,
  },
  mediaButtons: {
    flexDirection: "row",
  },
});

export default InputToolbar;
