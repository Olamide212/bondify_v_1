/**
 * ComplimentModal.jsx
 *
 * A modal that lets the current user send a compliment to the profile
 * they're viewing. The compliment is delivered to the target user's
 * inbox (POST /api/comments) which may create a possible match.
 */

import { Sparkles, X } from "lucide-react-native";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../../constant/colors";
import AIService from "../../services/aiService";
import { commentService } from "../../services/commentService";

const ComplimentModal = ({ visible, onClose, targetUser, currentUser, onSent }) => {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [matched, setMatched] = useState(false);
  const [error, setError] = useState(null);
  const [aiSuggestions, setAiSuggestions] = useState([]);

  const sentScale = useRef(new Animated.Value(0)).current;

  const handleClose = () => {
    setText("");
    setSent(false);
    setMatched(false);
    setError(null);
    setAiSuggestions([]);
    onClose();
  };

  const handleAISuggest = async () => {
    if (!targetUser?._id) {
      setError("Target user information not available");
      return;
    }

    if (!currentUser?._id) {
      setError("User information not available");
      return;
    }
    
    setAiLoading(true);
    setError(null);
    
    try {
      const data = await AIService.getPhotoCommentSuggestion(targetUser._id, 0);
      console.log("AI suggestion response:", data); // Debug log
      
      // Better handling of different response formats
      let suggestion = null;
      if (data?.suggestion) {
        suggestion = data.suggestion;
      } else if (typeof data === 'string') {
        suggestion = data;
      } else if (data?.data?.suggestion) {
        suggestion = data.data.suggestion;
      }
      
      if (suggestion && typeof suggestion === "string" && suggestion.trim()) {
        setAiSuggestions([suggestion.trim()]);
      } else {
        setError("Couldn't generate a valid suggestion. Try again.");
      }
    } catch (err) {
      console.error("AI suggestion error:", err);
      setError("Couldn't generate suggestion. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSend = async () => {
    // Validate inputs
    if (!text.trim()) {
      setError("Please enter a message");
      return;
    }
    
    if (!targetUser?._id) {
      setError("Target user information missing");
      return;
    }

    if (!currentUser?._id) {
      setError("Your user information missing. Please log in again.");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log("Sending comment with:", {
        currentUserId: currentUser._id,
        targetUserId: targetUser._id,
        content: text.trim(),
        imageIndex: 0
      });

      const res = await commentService.sendPhotoComment({
        targetUserId: targetUser._id,
        imageIndex: 0,
        imageUrl: targetUser?.profilePhoto || null,
        content: text.trim(),
      });

      console.log("Send response:", res); // Debug log

      // Check for match in different possible response structures
      const isMatch = res?.autoMatch?.matched === true || 
                      res?.data?.autoMatch?.matched === true ||
                      res?.matched === true;

      setMatched(isMatch);
      setSent(true);
      
      // Animate checkmark
      Animated.spring(sentScale, {
        toValue: 1,
        useNativeDriver: true,
        bounciness: 10,
        friction: 5
      }).start();

      // Call onSent callback if provided
      if (onSent) {
        onSent(res);
      }

      // Auto close after delay
      setTimeout(() => {
        handleClose();
      }, isMatch ? 2600 : 1800);

    } catch (e) {
      console.error("Send error:", e);
      
      // Better error message extraction
      const errorMessage = 
        e?.response?.data?.message || 
        e?.message || 
        "Failed to send. Please try again.";
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle AI suggestion click
  const handleSuggestionPress = (suggestion) => {
    setText(suggestion);
    // Optional: Auto-send after selecting suggestion? 
    // Uncomment next line if you want auto-send
    // setTimeout(() => handleSend(), 100);
  };

  const firstName = targetUser?.firstName ?? "them";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.backdrop} onPress={handleClose} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.sheetWrapper}
      >
        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              {targetUser?.profilePhoto ? (
                <Image source={{ uri: targetUser.profilePhoto }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarInitial}>{firstName[0]?.toUpperCase()}</Text>
                </View>
              )}
              <View>
                <Text style={styles.headerTitle}>Send a Compliment</Text>
                <Text style={styles.headerSub}>to {firstName}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleClose} hitSlop={12}>
              <X size={22} color="#999" />
            </TouchableOpacity>
          </View>

          {sent ? (
            // ── Success state ─────────────────────────────────────────────
            <View style={styles.successBox}>
              <Animated.Text style={[styles.successEmoji, { transform: [{ scale: sentScale }] }]}>
                {matched ? '🎉' : '💌'}
              </Animated.Text>
              <Text style={styles.successTitle}>
                {matched ? "It's a match!" : 'Compliment sent!'}
              </Text>
              <Text style={styles.successSub}>
                {matched
                  ? `You and ${firstName} both showed interest — you're now matched! 🔥`
                  : `${firstName} will see it in their inbox.`}
              </Text>
            </View>
          ) : (
            <>
              {/* Text input */}
              <TextInput
                style={styles.input}
                placeholder={`Say something kind to ${firstName}…`}
                placeholderTextColor="#BBB"
                value={text}
                onChangeText={setText}
                multiline
                maxLength={300}
                returnKeyType="default"
                autoFocus={visible}
                editable={!loading}
              />

              {/* Char count */}
              <Text style={styles.charCount}>{text.length}/300</Text>

              {/* AI suggestion chips */}
              {aiSuggestions.length > 0 && (
                <View style={styles.suggestionsRow}>
                  {aiSuggestions.map((s, i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles.suggestionChip}
                      onPress={() => handleSuggestionPress(s)}
                      activeOpacity={0.75}
                      disabled={loading}
                    >
                      <Text style={styles.suggestionText}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Error */}
              {!!error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Action row */}
              <View style={styles.actions}>
                {/* AI button */}
                <TouchableOpacity
                  style={styles.aiBtn}
                  onPress={handleAISuggest}
                  disabled={aiLoading || loading}
                  activeOpacity={0.8}
                >
                  {aiLoading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <>
                      <Sparkles size={16} color={colors.primary} />
                      <Text style={styles.aiBtnText}>AI Suggest</Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Send button */}
                <TouchableOpacity
                  style={[
                    styles.sendBtn,
                    (!text.trim() || loading) && styles.sendBtnDisabled
                  ]}
                  onPress={() => {
                    console.log("Send button pressed with text:", text);
                    handleSend();
                  }}
                  disabled={!text.trim() || loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.sendBtnText}>Send</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheetWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    paddingTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 12,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E0E0E0",
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerLeft: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 10 
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarFallback: {
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: { 
    color: "#fff", 
    fontSize: 18, 
    fontFamily: "PlusJakartaSansBold" 
  },
  headerTitle: { 
    fontSize: 16, 
    fontFamily: "PlusJakartaSansBold", 
    color: "#111" 
  },
  headerSub: { 
    fontSize: 13, 
    fontFamily: "PlusJakartaSans", 
    color: "#888", 
    marginTop: 1 
  },
  input: {
    minHeight: 100,
    maxHeight: 160,
    borderWidth: 1.5,
    borderColor: "#F0F0F0",
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    fontFamily: "PlusJakartaSans",
    color: "#111",
    backgroundColor: "#FAFAFA",
    textAlignVertical: "top",
  },
  charCount: { 
    textAlign: "right", 
    fontSize: 11, 
    color: "#CCC", 
    marginTop: 4, 
    marginBottom: 8 
  },
  suggestionsRow: { 
    marginBottom: 8 
  },
  suggestionChip: {
    backgroundColor: "#FFF0EA",
    borderWidth: 1,
    borderColor: colors.primaryBorder ?? "#F5C4AC",
    borderRadius: 12,
    padding: 10,
    marginBottom: 6,
  },
  suggestionText: { 
    fontSize: 14, 
    fontFamily: "PlusJakartaSans", 
    color: "#333" 
  },
  errorContainer: {
    backgroundColor: "#FFEBEE",
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  errorText: { 
    color: "#D32F2F", 
    fontSize: 13,
    textAlign: "center",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
    gap: 10,
  },
  aiBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 99,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: "#FFF8F5",
  },
  aiBtnText: { 
    fontSize: 14, 
    fontFamily: "PlusJakartaSansBold", 
    color: colors.primary 
  },
  sendBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 99,
    paddingVertical: 13,
    alignItems: "center",
  },
  sendBtnDisabled: { 
    opacity: 0.45 
  },
  sendBtnText: { 
    color: "#fff", 
    fontSize: 15, 
    fontFamily: "PlusJakartaSansBold" 
  },
  // Success
  successBox: {
    alignItems: "center",
    paddingVertical: 30,
    gap: 8,
  },
  successEmoji: { 
    fontSize: 52 
  },
  successTitle: { 
    fontSize: 20, 
    fontFamily: "PlusJakartaSansBold", 
    color: "#111" 
  },
  successSub: { 
    fontSize: 14, 
    fontFamily: "PlusJakartaSans", 
    color: "#888",
    textAlign: "center",
    paddingHorizontal: 20,
  },
});

export default ComplimentModal;