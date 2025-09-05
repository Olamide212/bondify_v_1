import React, { useState, useEffect, useRef } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
} from "react-native";
import { Image } from "expo-image";
import { SendHorizonal as PaperPlane, Sparkles, X } from "lucide-react-native";
import VoiceRecorder from "./VoiceRecorder";
import SuggestionModal from "../modals/AiSuggestionModal"; 

// Define suggestions for the modal
const suggestions = [
  "This photo is amazing! 📸",
  "I love this perspective! 👀",
  "The lighting here is perfect! ✨",
  "What a beautiful moment captured! ❤️",
  "This looks like an incredible place! 🌍",
];

export default function ImageSection({
  imageUri,
  index = 0,
  onPress,
  onSendMessage,
  onSendAudio,
}) {
  const [text, setText] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Animated value for sliding
  const slideAnim = useRef(new Animated.Value(100)).current; // starts hidden

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSendMessage?.(trimmed, index);
    setText("");
  };

  const handleSendAudio = (uri) => {
    onSendAudio?.(uri, index);
  };

  const handleRecordingStateChange = (recording) => {
    setIsRecording(recording);
  };

  useEffect(() => {
    if (showComposer) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 100,
        duration: 250,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [showComposer]);

  return (
    <View style={styles.wrapper}>
      {/* Image with modal trigger */}
      <Pressable onPress={onPress}>
        <Image
          source={{ uri: imageUri }}
          style={styles.image}
          contentFit="cover"
        />
      </Pressable>

      <View style={styles.commentRow}>
        {!showComposer ? (
          // Default Spark Icon
          <TouchableOpacity
            style={styles.sparkBtn}
            onPress={() => setShowComposer(true)}
          >
            <Sparkles size={28} color="white" />
          </TouchableOpacity>
        ) : (
          // Animated Composer
          <Animated.View
            style={[
              styles.composer,
              { transform: [{ translateY: slideAnim }] },
            ]}
          >
            {/* Close button */}
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setShowComposer(false)}
            >
              <X size={20} color="#6B7280" />
            </TouchableOpacity>

            {/* Text input (hidden during recording) */}
            {!isRecording && (
              <View style={styles.inputContainer}>
                <TextInput
                  value={text}
                  onChangeText={setText}
                  placeholder="Type a message..."
                  style={styles.input}
                />
                <TouchableOpacity
                  style={styles.inputSparkle}
                  onPress={() => setShowSuggestions(true)}
                >
                  <Sparkles size={18} color="#3B82F6" />
                </TouchableOpacity>
              </View>
            )}

            {/* Send button (hidden during recording) */}
            {!isRecording && text.length > 0 && (
              <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
                <PaperPlane size={20} color="#2563EB" />
              </TouchableOpacity>
            )}

            {/* Voice recorder - always rendered but conditionally visible */}
            <View style={isRecording ? styles.visible : styles.hidden}>
              <VoiceRecorder
                onSendAudio={handleSendAudio}
                onCancel={() => setShowComposer(false)}
                onRecordingStateChange={handleRecordingStateChange}
              />
            </View>
          </Animated.View>
        )}
      </View>

      {/* Suggestion Modal */}
      <SuggestionModal
        visible={showSuggestions}
        onClose={() => setShowSuggestions(false)}
        suggestions={suggestions}
        onSelectSuggestion={(suggestion) => {
          setText(suggestion);
          setShowSuggestions(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
    position: "relative",
  },
  image: {
    width: "100%",
    height: 700,
    backgroundColor: "#eee",
  },
  commentRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    paddingHorizontal: 10,
    position: "absolute",
    bottom: 10,
    width: "100%",
    justifyContent: "flex-end",
  },
  sparkBtn: {
    backgroundColor: "#2A343D",
    padding: 12,
    borderRadius: 30,
    alignSelf: "right",
  },
  composer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 25,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: "95%",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  closeBtn: {
    marginRight: 8,
    padding: 4,
  },
  inputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 20,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 6,
  },
  inputSparkle: {
    padding: 4,
  },
  sendBtn: {
    marginLeft: 8,
    backgroundColor: "#E0E7FF",
    padding: 10,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  visible: {
    display: "flex",
  },
  hidden: {
    display: "none",
  },
});
