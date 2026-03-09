import { Loader, SendHorizontal, Sparkles } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../../constant/colors";
import { matchService } from "../../services/matchService";
import { messageService } from "../../services/messageService";
import AISuggestionModal from "../modals/AiSuggestionModal";

export default function DirectMessageBox({ profile }) {
  const [message, setMessage]               = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sending, setSending]               = useState(false);
  const [sent, setSent]                     = useState(false);

  const handleSend = async () => {
    const trimmed = message.trim();
    if (!trimmed || sending || sent) return;

    setSending(true);
    try {
      // 1. Get the matchId for this profile
      //    getMatches returns an array; find the one where the other user is this profile
      const profileId = profile?.id ?? profile?._id;
      const matches   = await matchService.getMatches();

      const match = matches.find((m) => {
        // Match objects can have users as IDs or populated objects
        const userIds = (m.users ?? []).map((u) =>
          typeof u === "object" ? String(u._id ?? u.id) : String(u)
        );
        return userIds.includes(String(profileId));
      });

      if (!match) {
        Alert.alert(
          "Not matched yet",
          "You need to match with this person before sending a message."
        );
        return;
      }

      // 2. Send the message
      await messageService.sendMessage(match._id ?? match.id, {
        content: trimmed,
        type: "text",
      });

      setMessage("");
      setSent(true);

      // Reset sent state after 3 seconds so they can send again
      setTimeout(() => setSent(false), 3000);
    } catch (err) {
      console.error("DirectMessageBox send error:", err);
      Alert.alert("Failed to send", "Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <View>
      <Text className="text-lg font-PlusJakartaSansMedium mb-4">
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
          className="font-PlusJakartaSansMedium"
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
              <Text style={styles.sendBtnText}>Send a Bondo</Text>
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
    borderColor: "#D1D5DB",
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
    color: "#111827",
    minHeight: 52,
    maxHeight: 120,
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
    fontFamily: "PlusJakartaSansBold",
  },
});