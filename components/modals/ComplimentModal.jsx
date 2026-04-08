/**
 * ComplimentModal.jsx
 *
 * Centered card modal with dark overlay for sending a compliment.
 * After sending, plays a sound and shows a "View Other Profiles" button.
 */

import { Audio } from "expo-av";
import { Send, Sparkles, X } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { colors } from "../../constant/colors";
import AIService from "../../services/aiService";
import { commentService } from "../../services/commentService";

/** Resolve _id or id from a user/profile object */
const resolveId = (obj) => obj?._id ?? obj?.id ?? null;

/** Get the first image URL from a profile's images array */
const getProfileImage = (user) => {
  if (user?.profilePhoto) return user.profilePhoto;
  const imgs = user?.images;
  if (!Array.isArray(imgs) || imgs.length === 0) return null;
  const first = imgs[0];
  if (typeof first === "string") return first;
  return first?.url ?? first?.uri ?? null;
};

/** Play a short celebratory sound */
const playSentSound = async () => {
  let sound;
  try {
    const result = await Audio.Sound.createAsync(
      require("../../assets/sounds/match.wav"),
      { volume: 0.5 }
    );
    sound = result.sound;
    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish) sound.unloadAsync().catch(() => {});
    });
  } catch {
    if (sound) sound.unloadAsync().catch(() => {});
  }
};

const ComplimentModal = ({
  visible,
  onClose,
  targetUser,
  currentUser,
  onSent,
  onViewNextProfile,
}) => {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [matched, setMatched] = useState(false);
  const [error, setError] = useState(null);
  const [aiSuggestions, setAiSuggestions] = useState([]);

  // Animations
  const slideAnim = useRef(new Animated.Value(300)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const sentScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

  const [showModal, setShowModal] = useState(false);

  // Animate in / out (updated to include image opacity)
  useEffect(() => {
    if (visible) {
      setShowModal(true);
      slideAnim.setValue(300);
      overlayAnim.setValue(0);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          friction: 9,
          tension: 55,
        }),
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (showModal) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => setShowModal(false));
    }
  }, [visible]);

  const resetState = () => {
    setText("");
    setSent(false);
    setMatched(false);
    setError(null);
    setAiSuggestions([]);
    sentScale.setValue(0);
    successOpacity.setValue(0);
  };

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      resetState();
      setShowModal(false);
      onClose();
    });
  };

  const targetId = resolveId(targetUser);
  const currentId = resolveId(currentUser);

  const handleAISuggest = async () => {
    if (!targetId) {
      setError("Target user information not available");
      return;
    }
    if (!currentId) {
      setError("User information not available");
      return;
    }

    setAiLoading(true);
    setError(null);

    try {
      const data = await AIService.getPhotoCommentSuggestion(targetId, 0);

      let suggestion = null;
      if (data?.suggestion) suggestion = data.suggestion;
      else if (typeof data === "string") suggestion = data;
      else if (data?.data?.suggestion) suggestion = data.data.suggestion;

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
    if (!text.trim()) {
      setError("Please enter a message");
      return;
    }
    if (!targetId) {
      setError("Target user information missing");
      return;
    }
    if (!currentId) {
      setError("Your user information missing. Please log in again.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await commentService.sendPhotoComment({
        targetUserId: targetId,
        imageIndex: 0,
        imageUrl: getProfileImage(targetUser),
        content: text.trim(),
      });

      const isMatch =
        res?.autoMatch?.matched === true ||
        res?.data?.autoMatch?.matched === true ||
        res?.matched === true;

      setMatched(isMatch);
      setSent(true);

      // Play success sound
      playSentSound();

      // Animate success view
      Animated.parallel([
        Animated.spring(sentScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 80,
          friction: 5,
        }),
        Animated.timing(successOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();

      if (onSent) onSent(res);
    } catch (e) {
      console.error("Send error:", e);
      const errorMessage =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to send. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionPress = (suggestion) => {
    setText(suggestion);
  };

  const handleViewNextProfile = () => {
    resetState();
    if (onViewNextProfile) {
      onViewNextProfile();
    }
    handleClose();
  };

  const firstName =
    targetUser?.firstName ??
    (typeof targetUser?.name === "string"
      ? targetUser.name.split(" ")[0]
      : "them");

  if (!showModal) return null;

  return (
    <Modal
      visible={showModal}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <StatusBar barStyle="light-content" />

      {/* ─── Dark overlay ─── */}
      <Animated.View style={[styles.overlay, { opacity: overlayAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>

      {/* ─── Centered card ─── */}
      <KeyboardAvoidingView
        style={styles.centeredWrapper}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        pointerEvents="box-none"
      >
        <Animated.View
          style={[
            styles.card,
            { transform: [{ translateY: slideAnim }], opacity: overlayAnim },
          ]}
        >
          {/* Card header */}
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} className="font-OutfitBold">
              Send Compliment
            </Text>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeBtn}
              hitSlop={12}
            >
              <X size={20} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          </View>

          {sent ? (
            /* ─── Success state ─── */
            <Animated.View
              style={[styles.successContainer, { opacity: successOpacity }]}
            >
              <Animated.Text
                style={[
                  styles.successEmoji,
                  { transform: [{ scale: sentScale }] },
                ]}
              >
                {matched ? "🎉" : "💌"}
              </Animated.Text>
              <Text
                style={styles.successTitle}
                className="font-OutfitBold"
              >
                {matched ? "It's a match!" : "Compliment sent!"}
              </Text>
              <Text
                style={styles.successSub}
                className="font-Outfit"
              >
                {matched
                  ? `You and ${firstName} both showed interest — you're now matched! 🔥`
                  : `${firstName} will see it in their inbox.`}
              </Text>

              <TouchableOpacity
                style={styles.viewNextBtn}
                onPress={handleViewNextProfile}
                activeOpacity={0.85}
              >
                <Text
                  style={styles.viewNextBtnText}
                  className="font-OutfitBold"
                >
                  View Other Profiles
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            /* ─── Compose state ─── */
            <View style={styles.composeContainer}>
              {/* Name label */}
              <Text
                style={styles.composeLabel}
                className="font-OutfitBold"
              >
                Send a compliment to {firstName}
              </Text>

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
                      <Text
                        style={styles.suggestionText}
                        className="font-Outfit"
                      >
                        {s}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Error notice */}
              {!!error && (
                <View style={styles.errorContainer}>
                  <Text
                    style={styles.errorText}
                    className="font-Outfit"
                  >
                    {error}
                  </Text>
                </View>
              )}

              {/* Input row */}
              <View style={styles.inputRow}>
                {/* AI Suggest button */}
                <TouchableOpacity
                  style={styles.aiIconBtn}
                  onPress={handleAISuggest}
                  disabled={aiLoading || loading}
                  activeOpacity={0.8}
                >
                  {aiLoading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Sparkles size={20} color={colors.white} />
                  )}
                </TouchableOpacity>

                {/* Text input */}
                <TextInput
                  style={styles.input}
                  placeholder={`Say something kind…`}
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={text}
                  onChangeText={setText}
                  multiline
                  maxLength={300}
                  returnKeyType="default"
                  editable={!loading}
                />

                {/* Send button */}
                <TouchableOpacity
                  style={[
                    styles.sendIconBtn,
                    (!text.trim() || loading) && styles.sendIconBtnDisabled,
                  ]}
                  onPress={handleSend}
                  disabled={!text.trim() || loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Send size={20} color={colors.white} />
                  )}
                </TouchableOpacity>
              </View>

              <Text style={styles.charCount} className="font-Outfit">
                {text.length}/300
              </Text>
            </View>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.65)",
  },
  centeredWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#121212",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    padding: 20,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    color: "#fff",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  // ── Compose state ──
  composeContainer: {
    gap: 10,
  },
  composeLabel: {
    fontSize: 16,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 4,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  aiIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    fontSize: 15,
    fontFamily: "Outfit",
    color: "#fff",
    paddingVertical: 8,
    textAlignVertical: "top",
  },
  sendIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendIconBtnDisabled: {
    opacity: 0.4,
  },
  charCount: {
    textAlign: "right",
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
  },
  suggestionsRow: {
    gap: 6,
  },
  suggestionChip: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    padding: 10,
  },
  suggestionText: {
    fontSize: 14,
    color: "#fff",
  },
  errorContainer: {
    backgroundColor: "rgba(211,47,47,0.2)",
    padding: 10,
    borderRadius: 8,
  },
  errorText: {
    color: "#fff",
    fontSize: 13,
    textAlign: "center",
  },
  // ── Success state ──
  successContainer: {
    alignItems: "center",
    paddingVertical: 20,
    gap: 10,
  },
  successEmoji: {
    fontSize: 56,
  },
  successTitle: {
    fontSize: 24,
    color: "#fff",
  },
  successSub: {
    fontSize: 15,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    paddingHorizontal: 10,
    lineHeight: 22,
  },
  viewNextBtn: {
    marginTop: 20,
    backgroundColor: colors.white,
    borderRadius: 99,
    paddingVertical: 15,
    paddingHorizontal: 36,
    alignItems: "center",
  },
  viewNextBtnText: {
    color: colors.primary,
    fontSize: 16,
  },
});

export default ComplimentModal;