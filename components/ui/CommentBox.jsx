import { Image } from "expo-image";
import { MessageCircleHeart, SendHorizonal as PaperPlane, Sparkles, X } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Easing,
    Pressable,
    StyleSheet,
  Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { colors } from "../../constant/colors";
import { useAlert } from "../../context/AlertContext";
import { useToast } from "../../context/ToastContext";
import { commentService } from "../../services/commentService";
import AISuggestionModal from "../modals/AiSuggestionModal";

export default function CommentBox({
  imageUri,
  index = 0,
  onPress,
  showComposer: showComposerProp = false,
  // The profile of the person whose photo this is
  profile,
  blurPhotos = false,
}) {
  const { showAlert } = useAlert();
  const { showToast } = useToast();
  const [text, setText]                   = useState("");
  const [showComposer, setShowComposer]   = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sending, setSending]             = useState(false);

  const slideAnim = useRef(new Animated.Value(30)).current;
  const composerOpacity = useRef(new Animated.Value(0)).current;
  const revealOpacity = useRef(new Animated.Value(0)).current;
  const revealTranslateY = useRef(new Animated.Value(22)).current;
  const revealScale = useRef(new Animated.Value(0.97)).current;
  const hasAnimatedIn = useRef(false);

  const runRevealAnimation = useCallback(() => {
    Animated.parallel([
      Animated.timing(revealOpacity, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(revealTranslateY, {
        toValue: 0,
        duration: 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(revealScale, {
        toValue: 1,
        duration: 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [revealOpacity, revealScale, revealTranslateY]);

  // Sync with parent-controlled visibility (scroll-based)
  useEffect(() => {
    if (showComposerProp) {
      setShowComposer(true);
      if (!hasAnimatedIn.current) {
        hasAnimatedIn.current = true;
        runRevealAnimation();
      }
    }
  }, [runRevealAnimation, showComposerProp]);

  useEffect(() => {
    if (hasAnimatedIn.current) return;
    const timer = setTimeout(() => {
      if (!hasAnimatedIn.current) {
        hasAnimatedIn.current = true;
        runRevealAnimation();
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [runRevealAnimation]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: showComposer ? 0 : 30,
        duration: showComposer ? 320 : 220,
        easing: showComposer ? Easing.out(Easing.cubic) : Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(composerOpacity, {
        toValue: showComposer ? 1 : 0,
        duration: showComposer ? 240 : 140,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [composerOpacity, showComposer, slideAnim]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

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
      setShowComposer(false);
      setShowSuggestions(false);
      showToast({
        message: "Comment sent successfully",
        variant: "success",
      });
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
    <Animated.View
      style={[
        styles.wrapper,
        {
          opacity: revealOpacity,
          transform: [
            { translateY: revealTranslateY },
            { scale: revealScale },
          ],
        },
      ]}
    >
      <View style={styles.card}>
        <Pressable onPress={onPress} style={styles.imagePressable}>
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            contentFit="cover"
            className="rounded-[28px]"
            blurRadius={blurPhotos ? 25 : 0}
          />
          <View style={styles.imageShade} />

          {blurPhotos && (
            <View style={styles.blurBadge}>
              <Sparkles size={14} color="#fff" />
              <Text style={styles.blurBadgeText}>Blurred until you match</Text>
            </View>
          )}
        </Pressable>

        <View style={styles.commentRow}>
          {!showComposer ? (
            <View style={styles.collapsedPrompt}>
              <View style={styles.promptCopy}>
                <View style={styles.promptIconWrap}>
                  <MessageCircleHeart size={18} color={colors.primary} />
                </View>
                <View style={styles.promptTextWrap}>
                  <Text style={styles.promptEyebrow}>Photo comment</Text>
                  <Text style={styles.promptTitle}>Send a thoughtful opener</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.sparkBtn}
                onPress={() => setShowComposer(true)}
                activeOpacity={0.9}
              >
                <Sparkles size={20} color="#fff" fill="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <Animated.View
              style={[
                styles.composer,
                {
                  opacity: composerOpacity,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <View style={styles.composerHeader}>
                <View style={styles.composerHeaderCopy}>
                  <Text style={styles.composerTitle}>Comment on this photo</Text>
                  <Text style={styles.composerSubtitle}>Keep it warm, playful, and specific.</Text>
                </View>
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => {
                    setShowComposer(false);
                    setText("");
                  }}
                >
                  <X size={18} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  value={text}
                  onChangeText={setText}
                  placeholder="Type a thoughtful opener…"
                  placeholderTextColor="#9CA3AF"
                  style={styles.input}
                  multiline
                  maxLength={200}
                  editable={!sending}
                  textAlignVertical="top"
                  className="font-PlusJakartaSansMedium text-white"
                />
                <TouchableOpacity
                  style={styles.inputSparkle}
                  onPress={() => setShowSuggestions(true)}
                  disabled={sending}
                >
                  <Sparkles size={18} color={colors.primary} />
                </TouchableOpacity>
              </View>

              <View style={styles.footerRow}>
                <Text style={styles.helperText}>{text.length}/200</Text>

                <TouchableOpacity
                  style={[
                    styles.sendBtn,
                    (!text.trim() || sending) && styles.sendBtnDisabled,
                  ]}
                  onPress={handleSend}
                  disabled={!text.trim() || sending}
                >
                  {sending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.sendBtnText}>Send</Text>
                      <PaperPlane size={16} color="#fff" />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}
        </View>
      </View>

      {/* AI Suggestion Modal — context='photo' gives photo-specific prompts */}
      <AISuggestionModal
        visible={showSuggestions}
        onClose={() => setShowSuggestions(false)}
        profile={profile}
        context="photo"
        onSelectSuggestion={(suggestion) => {
          setText(suggestion);
        }}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
    marginHorizontal: 12,
    marginBottom: 10,
  },
  card: {
    position: "relative",
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: "#161616",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  imagePressable: {
    borderRadius: 15,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: 600,
    backgroundColor: "#222",
    borderRadius: 15,
  },
  imageShade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 210,
    // backgroundColor: "rgba(0,0,0,0.22)",
  },
  commentRow: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 14,
  },
  blurBadge: {
    position: "absolute",
    top: 14,
    left: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.52)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  blurBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "PlusJakartaSansSemiBold",
  },
  collapsedPrompt: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: "rgba(12,12,12,0.82)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  promptCopy: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 12,
  },
  promptIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    marginRight: 10,
  },
  promptTextWrap: {
    flex: 1,
  },
  promptEyebrow: {
    color: "#9CA3AF",
    fontSize: 12,
    fontFamily: "PlusJakartaSansMedium",
    marginBottom: 2,
  },
  promptTitle: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "PlusJakartaSansSemiBold",
  },
  sparkBtn: {
    width: 48,
    height: 48,
    backgroundColor: colors.primary,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  composer: {
    backgroundColor: "rgba(12,12,12,0.92)",
    borderRadius: 24,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  composerHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  composerHeaderCopy: {
    flex: 1,
    paddingRight: 12,
  },
  composerTitle: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "PlusJakartaSansSemiBold",
    marginBottom: 2,
  },
  composerSubtitle: {
    color: "#9CA3AF",
    fontSize: 13,
    fontFamily: "PlusJakartaSansMedium",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#151515",
    borderRadius: 18,
    paddingLeft: 14,
    paddingRight: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    minHeight: 94,
  },
  input: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    paddingVertical: 2,
    paddingRight: 8,
    minHeight: 72,
    maxHeight: 110,
    color: "#fff",
  },
  inputSparkle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  footerRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  helperText: {
    color: "#9CA3AF",
    fontSize: 12,
    fontFamily: "PlusJakartaSansMedium",
  },
  sendBtn: {
    minWidth: 104,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
  },
  sendBtnText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "PlusJakartaSansSemiBold",
  },
  sendBtnDisabled: { opacity: 0.5 },
});