import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SendHorizontal, Sparkles } from "lucide-react-native";
import SuggestionModal from "../modals/AiSuggestionModal";

const suggestions = [
  "Hey 👋, your profile looks interesting!",
  "I'd love to know more about your hobbies ✨",
  "You seem like someone who loves adventures 🌍",
  "That smile is contagious 😄, what's your secret?",
  "Coffee or Tea? ☕️🍵",
];

export default function DirectMessageBox({ profile, onSendMessage }) {
  const [message, setMessage] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed) return;

    // Call the parent component's send message function
    onSendMessage?.(trimmed);
    setMessage("");
  };

  const hasMessage = message.trim().length > 0;

  return (
    <View style={styles.container}>
      <Text className="text-lg font-GeneralSansMedium mb-6">
        Ready to Bond? Send a direct message to {profile.name || "them"} now.
      </Text>

      {/* Comment box */}
      <View style={styles.commentBox}>
        <TextInput
          placeholder="Write something about this profile..."
          placeholderTextColor="#ccc"
          style={styles.input}
          multiline
          value={message}
          onChangeText={setMessage}
          className="font-GeneralSansMedium"
        />
      </View>

      {/* Conditionally render buttons to avoid empty space */}

      <View className="flex-row items-center bg-primary mt-4 px-2 py-2 rounded-full">
        <TouchableOpacity
          className="w-10 h-10 flex-row items-center justify-center rounded-full bg-white"
          onPress={() => setShowSuggestions(true)}
        >
          <Sparkles size={22} color="#E94057" />
        </TouchableOpacity>
        <TouchableOpacity
          className="w-[80%]  flex-row justify-center text-center"
          onPress={handleSend}
        >
          <Text className="text-center text-white text-xl font-GeneralSansMedium">
            Send a spark
          </Text>
        </TouchableOpacity>
      </View>

      {/* AI Suggestion Modal */}
      <SuggestionModal
        visible={showSuggestions}
        onClose={() => setShowSuggestions(false)}
        suggestions={suggestions}
        onSelectSuggestion={setMessage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    marginHorizontal: 16,
    padding: 24,
    marginTop: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#3B82F6",
  },
  commentBox: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    padding: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "black",
    minHeight: 50,
    maxHeight: 120,
    marginRight: 8, // Add some spacing between input and buttons
  },
  sparkleButton: {
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderRadius: 9999,
    padding: 12,
  },
  sendButton: {
    marginLeft: 8,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderRadius: 9999,
    padding: 12,
  },
});
