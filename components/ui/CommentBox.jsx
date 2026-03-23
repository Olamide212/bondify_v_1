import { Image } from "expo-image";
import { SendHorizonal as PaperPlane, Sparkles, X } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Easing,
    Pressable,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { colors } from "../../constant/colors";
import { useAlert } from "../../context/AlertContext";
import { commentService } from "../../services/commentService";
import AISuggestionModal from "../modals/AiSuggestionModal";

export default function CommentBox({
  imageUri,
  index = 0,
  onPress,
  showComposer: showComposerProp = false,
  // The profile of the person whose photo this is
  profile,
}) {
  const { showAlert } = useAlert();
  const [text, setText]                   = useState("");
  const [showComposer, setShowComposer]   = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sending, setSending]             = useState(false);
  const [sent, setSent]                   = useState(false);

  const slideAnim = useRef(new Animated.Value(100)).current;

  // Sync with parent-controlled visibility (scroll-based)
  useEffect(() => {
    if (showComposerProp) setShowComposer(true);
  }, [showComposerProp]);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: showComposer ? 0 : 100,
      duration: showComposer ? 350 : 250,
      easing: showComposer ? Easing.out(Easing.ease) : Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [showComposer]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending || sent) return;

    const targetUserId = profile?._id ?? profile?.id;
    if (!targetUserId) {
      showAlert({
        icon: 'error',
        title: 'Error',
        message: 'Could not identify the profile. Please try again.',
      });
      return;
    }

    setSending(true);
    try {
      await commentService.sendPhotoComment({
        targetUserId,
        imageIndex: index,
        imageUrl:   imageUri,
        content:    trimmed,
      });

      setText("");
      setSent(true);
      // Reset after 3s so they can comment again
      setTimeout(() => setSent(false), 3000);
    } catch (err) {
      console.error("CommentBox send error:", err);
      showAlert({
        icon: 'error',
        title: 'Failed to send',
        message: 'Something went wrong. Please try again.',
      });
    } finally {
      setSending(false);
    }
  };

  if (!imageUri) return null;

  return (
    <View style={styles.wrapper} className="mb-2 mx-2 rounded-2xl border border-gray-200">
      {/* Image */}
      <Pressable onPress={onPress} className="rounded-2xl">
        <Image
          source={{ uri: imageUri }}
          style={styles.image}
          contentFit="cover"
          className="rounded-2xl"
        />
      </Pressable>

      {/* Composer overlay */}
      <View style={styles.commentRow}>
        {!showComposer ? (
          // Sparkle FAB — tap to open composer
          <TouchableOpacity
            style={styles.sparkBtn}
            onPress={() => setShowComposer(true)}
          >
            <Sparkles size={26} color="#fff" />
          </TouchableOpacity>
        ) : (
          <Animated.View
            style={[styles.composer, { transform: [{ translateY: slideAnim }] }]}
          >
            {/* Close */}
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => { setShowComposer(false); setText(""); }}
            >
              <X size={20} color="#6B7280" />
            </TouchableOpacity>

            {/* Input + AI sparkle */}
            <View style={[styles.inputContainer, sent && styles.inputContainerSent]}>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder={sent ? "Comment sent! 🎉" : "Say something…"}
                placeholderTextColor={sent ? "#22C55E" : "#ccc"}
                style={styles.input}
                multiline
                maxLength={200}
                editable={!sending && !sent}
                className='font-PlusJakartaSansMedium'
              />
              <TouchableOpacity
                style={styles.inputSparkle}
                onPress={() => setShowSuggestions(true)}
                disabled={sending}
              >
                <Sparkles size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Send button */}
            {(text.length > 0 || sending) && (
              <TouchableOpacity
                style={[styles.sendBtn, (sending || sent) && styles.sendBtnDisabled]}
                onPress={handleSend}
                disabled={sending || sent}
              >
                {sending
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <PaperPlane size={20} color="#fff" />
                }
              </TouchableOpacity>
            )}
          </Animated.View>
        )}
      </View>

      {/* AI Suggestion Modal — context='photo' gives photo-specific prompts */}
      <AISuggestionModal
        visible={showSuggestions}
        onClose={() => setShowSuggestions(false)}
        profile={profile}
        context="photo"
        onSelectSuggestion={(suggestion) => {
          setText(suggestion);
          setSent(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: "relative" },
  image: {
    width: "100%",
    height: 600,
    backgroundColor: "#eee",
    borderRadius: 15,
  },
  commentRow: {
    position: "absolute",
    bottom: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  sparkBtn: {
    backgroundColor: colors.activePrimary ?? colors.primary,
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
    width: "97%",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  closeBtn: { marginRight: 8, padding: 4 },
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
  inputContainerSent: {
    borderColor: "#22C55E",
    backgroundColor: "#F0FDF4",
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 6,
    maxHeight: 100,
    color: "#111827",
  },
  inputSparkle: { padding: 4, marginLeft: 8 },
  sendBtn: {
    marginLeft: 8,
    backgroundColor: colors.activePrimary ?? colors.primary,
    padding: 10,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: { opacity: 0.5 },
});