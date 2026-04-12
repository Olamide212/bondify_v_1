import { RotateCcw, Sparkles } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { colors } from "../../constant/colors";
import AIService from "../../services/aiService";

// ─────────────────────────────────────────────────────────────────────────────
// context: 'direct' = first message to a profile
//          'photo'  = comment on a specific photo

const AISuggestionModal = ({
  visible,
  onClose,
  profile,
  onSelectSuggestion,
  context = 'direct',   // 'direct' | 'photo'
  imageIndex = 0,       // only relevant when context='photo'
}) => {
  const [suggestion, setSuggestion]     = useState("");
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [showModal, setShowModal]       = useState(false);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

  // Animate in / out
  useEffect(() => {
    if (visible) {
      setShowModal(true);
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.85);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-generate on first open
      if (!hasGenerated) generate();
    } else if (showModal) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.85,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => setShowModal(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const targetUserId = profile?._id ?? profile?.id;

  const generate = async () => {
    if (!targetUserId) {
      setError("Profile not available. Please try again.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      let result;

      if (context === 'photo') {
        // POST /api/ai/suggest-photo-comment
        result = await AIService.getPhotoCommentSuggestion(targetUserId, imageIndex);
      } else {
        // POST /api/ai/suggest-message
        result = await AIService.getMessageSuggestion(targetUserId);
      }

      const text = result?.data?.suggestion ?? result?.suggestion;
      if (!text) throw new Error("Empty response from server");

      setSuggestion(text);
      setHasGenerated(true);
    } catch (err) {
      console.error("AISuggestionModal generate error:", err);
      setError("Couldn't generate a suggestion. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUse   = () => { if (suggestion) { onSelectSuggestion(suggestion); onClose(); } };
  const handleClose = () => onClose();

  if (!showModal) return null;

  return (
    <Modal
      visible={showModal}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      {/* Overlay */}
      <TouchableWithoutFeedback onPress={handleClose}>
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]} />
      </TouchableWithoutFeedback>

      {/* Centered card */}
      <View style={styles.centerWrapper} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.card,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.sparkleCircle}>
                <Sparkles size={16} color={colors.primary} />
              </View>
              <Text style={styles.headerTitle}>
                {context === 'photo' ? 'AI Photo Comment' : 'AI Suggestion'}
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.body}>
            {loading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.loadingText}>
                  {context === 'photo' ? 'Crafting a comment…' : 'Writing something great…'}
                </Text>
              </View>
            ) : error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : suggestion ? (
              <Text style={styles.suggestionText}>&quot;{suggestion}&quot;</Text>
            ) : null}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.regenBtn}
              onPress={generate}
              disabled={loading}
            >
              <RotateCcw size={18} color={colors.primary} />
              <Text style={styles.regenText}>Try another</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.useBtn, (!suggestion || loading) && styles.useBtnDisabled]}
              onPress={handleUse}
              disabled={!suggestion || loading}
            >
              <Text style={styles.useBtnText}>Use this </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  centerWrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#121212",
    borderRadius: 24,
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 14,
    // borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#333333",
  },
  headerLeft:    { flexDirection: "row", alignItems: "center", gap: 10 },
  sparkleCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: `${colors.primary}18`,
    alignItems: "center", justifyContent: "center",
  },
  headerTitle:   { fontSize: 17, fontFamily: "PlusJakartaSansBold", color: "#fff" },
  closeText:     { fontSize: 15, fontFamily: "PlusJakartaSansMedium", color: '#9CA3AF' },
  body:          { minHeight: 100, paddingHorizontal: 24, paddingVertical: 24, justifyContent: "center" },
  loadingWrap:   { alignItems: "center", gap: 10 },
  loadingText:   { fontSize: 14, fontFamily: "PlusJakartaSans", color: "#9CA3AF" },
  errorText:     { fontSize: 14, fontFamily: "PlusJakartaSans", color: "#EF4444", textAlign: "center" },
  suggestionText:{ fontSize: 18, fontFamily: "PlusJakartaSansMedium", color: "#fff", lineHeight: 28, textAlign: "center" },
  actions:       { flexDirection: "row", gap: 12, paddingHorizontal: 20, paddingTop: 8 },
  regenBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingVertical: 14, paddingHorizontal: 18, borderRadius: 50,
    borderWidth: 1, borderColor: '#374151', backgroundColor: `${colors.primary}10`,
  },
  regenText:      { fontSize: 14, fontFamily: "PlusJakartaSansMedium", color: colors.primary },
  useBtn:         { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 14, borderRadius: 50, backgroundColor: colors.primary },
  useBtnDisabled: { opacity: 0.45 },
  useBtnText:     { color: "#fff", fontSize: 15, fontFamily: "PlusJakartaSansBold" },
});

export default AISuggestionModal;