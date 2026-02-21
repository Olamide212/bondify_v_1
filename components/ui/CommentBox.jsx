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
import SuggestionModal from "../modals/AiSuggestionModal";
import { colors } from "../../constant/colors";

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
  scrollPosition, // New prop to track scroll position
  commentThreshold = 0.7, // When to show comment box (70% of image visible)
}) {
  const [text, setText] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Animated value for sliding
  const slideAnim = useRef(new Animated.Value(100)).current; // starts hidden

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSendMessage?.(trimmed, index);
    setText("");
  };

  // Determine if comment box should be visible based on scroll position
  useEffect(() => {
    if (scrollPosition !== undefined) {
      // Show comment box when image is 70% visible
      const shouldShow = scrollPosition >= commentThreshold;
      setShowComposer(shouldShow);
    }
  }, [scrollPosition, commentThreshold]);

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
            <Sparkles size={26} color="#5A56D0" />
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

            {/* Text input */}
            <View style={styles.inputContainer}>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="Type a message..."
                placeholderTextColor="#ccc"
                style={styles.input}
                multiline
                maxLength={200}
              />
              <TouchableOpacity
                style={styles.inputSparkle}
                onPress={() => setShowSuggestions(true)}
              >
                <Sparkles size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Send button */}
            {text.length > 0 && (
              <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
                <PaperPlane size={20} color="#5A56D0" />
              </TouchableOpacity>
            )}
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
    position: "relative",
  },
  image: {
    width: "100%",
    height: 600, // Reduced height for better scrolling experience
    backgroundColor: "#eee",
  },
  commentRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    paddingHorizontal: 10,
    position: "absolute",
    bottom: 10,
    right: 10,
    justifyContent: "flex-end",
  },
  sparkBtn: {
    backgroundColor: "#FAE83C",
    padding: 12,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  composer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 25,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: "85%",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#E5E7EB",
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
    minHeight: 40,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 6,
    maxHeight: 100,
  },
  inputSparkle: {
    padding: 4,
    marginLeft: 8,
  },
  sendBtn: {
    marginLeft: 8,
    backgroundColor: "#E0E7FF",
    padding: 10,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
