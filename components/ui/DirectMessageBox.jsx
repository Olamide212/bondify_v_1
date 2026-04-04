import { SendHorizontal, Sparkles } from "lucide-react-native";
import { useState } from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { colors } from "../../constant/colors";
import { useAlert } from "../../context/AlertContext";
import { messageService } from "../../services/messageService";
import AISuggestionModal from "../modals/AiSuggestionModal";

export default function DirectMessageBox({ profile }) {
  const { showAlert } = useAlert();
  const [message, setMessage]               = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sending, setSending]               = useState(false);
  const [sent, setSent]                     = useState(false);

  const handleSend = async () => {
    const trimmed = message.trim();
    if (!trimmed || sending || sent) return;

    const profileId = String(profile?.id ?? profile?._id ?? "");
    if (!profileId) {
      showAlert({
        icon: 'error',
        title: 'Error',
        message: 'Could not identify this user.',
      });
      return;
    }

    setSending(true);
    try {
      // Send a direct message — no match required.
      // The backend creates a pending conversation thread if none exists.
      await messageService.sendDirectMessage(profileId, trimmed);

      setMessage("");
      setSent(true);

      // Reset sent state after 3 seconds so they can send again
      setTimeout(() => setSent(false), 3000);
    } catch (err) {
      console.error("DirectMessageBox send error:", err);
      showAlert({
        icon: 'error',
        title: 'Failed to send',
        message: err?.message || 'Something went wrong. Please try again.',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <View>
      <Text className="text-lg text-white font-Outfit mb-4">
        Ready to Bond? Send {profile?.name || profile?.firstName || "them"} a
        direct message now. Starting a conversation boosts your chances of
        matching — type your own or let AI suggest one.
      </Text>

      {/* Input */}
      <View style={[styles.inputWrap, sent && styles.inputWrapSent]}>
        <TextInput
          placeholder={sent ? "Message sent! 🎉" : "Type a message…"}
          placeholderTextColor={sent ? "#22C55E" : "#9CA3AF"}
          style={styles.input}
          className="font-OutfitMedium text-white"
          multiline
          value={message}
          onChangeText={setMessage}
          editable={!sending && !sent}
        />
      </View>

      {/* Action row */}
      <View style={styles.actionRow}>
        {/* AI sparkle button */}
        <TouchableOpacity
          style={styles.sparkleBtn}
          onPress={() => setShowSuggestions(true)}
          disabled={sending}
        >
          <Sparkles size={20} color={colors.primary} />
        </TouchableOpacity>

        {/* Send button */}
        <TouchableOpacity
          style={[
            styles.sendBtn,
            (!message.trim() || sending || sent) && styles.sendBtnDisabled,
          ]}
          onPress={handleSend}
          disabled={!message.trim() || sending || sent}
          activeOpacity={0.85}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : sent ? (
            <Text style={styles.sendBtnText}>Sent ✓</Text>
          ) : (
            <View style={styles.sendBtnInner}>
              <Text style={styles.sendBtnText}>Send a BonSpark</Text>
              <SendHorizontal size={18} color="#fff" strokeWidth={2.5} />
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* AI Suggestion Modal */}
      <AISuggestionModal
        visible={showSuggestions}
        onClose={() => setShowSuggestions(false)}
        profile={profile}
        onSelectSuggestion={(text) => {
          setMessage(text);
          setSent(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  inputWrap: {
    borderWidth: 1,
    borderColor: '#4B5563',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  inputWrapSent: {
    borderColor: "#22C55E",
    backgroundColor: "#F0FDF4",
  },
  input: {
    fontSize: 15,
    minHeight: 52,
    maxHeight: 120,
    color: "#fff",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sparkleBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: `${colors.primary}15`,
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
  },
  sendBtn: {
    flex: 1,
    height: 48,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  sendBtnDisabled: {
    opacity: 0.45,
  },
  sendBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sendBtnText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "OutfitBold",
  },
});