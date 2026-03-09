import { RotateCcw, Sparkles } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
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

  // Auto-generate on first open
  const handleOpen  = () => { if (!hasGenerated) generate(); };
  const handleUse   = () => { if (suggestion) { onSelectSuggestion(suggestion); onClose(); } };
  const handleClose = () => onClose();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      onShow={handleOpen}
    >
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />

      <View style={styles.sheet}>
        <View style={styles.handle} />

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
            <Text style={styles.regenText}>Try again</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.useBtn, (!suggestion || loading) && styles.useBtnDisabled]}
            onPress={handleUse}
            disabled={!suggestion || loading}
          >
            <Text style={styles.useBtnText}>Use this ✓</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop:      { flex: 1, backgroundColor: "rgba(0,0,0,0.35)" },
  sheet: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingBottom: 36,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: "#E5E7EB",
    alignSelf: "center", marginTop: 12, marginBottom: 4,
  },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#F3F4F6",
  },
  headerLeft:    { flexDirection: "row", alignItems: "center", gap: 10 },
  sparkleCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: `${colors.primary}18`,
    alignItems: "center", justifyContent: "center",
  },
  headerTitle:   { fontSize: 17, fontFamily: "PlusJakartaSansBold", color: "#111827" },
  closeText:     { fontSize: 15, fontFamily: "PlusJakartaSansMedium", color: "#6B7280" },
  body:          { minHeight: 100, paddingHorizontal: 24, paddingVertical: 24, justifyContent: "center" },
  loadingWrap:   { alignItems: "center", gap: 10 },
  loadingText:   { fontSize: 14, fontFamily: "PlusJakartaSans", color: "#9CA3AF" },
  errorText:     { fontSize: 14, fontFamily: "PlusJakartaSans", color: "#EF4444", textAlign: "center" },
  suggestionText:{ fontSize: 18, fontFamily: "PlusJakartaSansMedium", color: "#111827", lineHeight: 28, textAlign: "center" },
  actions:       { flexDirection: "row", gap: 12, paddingHorizontal: 20, paddingTop: 8 },
  regenBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingVertical: 14, paddingHorizontal: 18, borderRadius: 50,
    borderWidth: 1, borderColor: "#E5E7EB", backgroundColor: `${colors.primary}10`,
  },
  regenText:      { fontSize: 14, fontFamily: "PlusJakartaSansMedium", color: colors.primary },
  useBtn:         { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 14, borderRadius: 50, backgroundColor: colors.primary },
  useBtnDisabled: { opacity: 0.45 },
  useBtnText:     { color: "#fff", fontSize: 15, fontFamily: "PlusJakartaSansBold" },
});

export default AISuggestionModal;