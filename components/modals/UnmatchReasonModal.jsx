/**
 * UnmatchReasonModal.jsx
 *
 * Bottom-sheet style modal that asks why the user wants to unmatch.
 * Similar pattern to BlockReportModal.
 */

import { ChevronRight, HeartCrack, X } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Easing,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { colors } from "../../constant/colors";

const { height: SH } = Dimensions.get("window");

// ── Unmatch reasons ─────────────────────────────────────────────────────────
const UNMATCH_REASONS = [
  { key: "no_connection",   label: "No connection",            emoji: "💔" },
  { key: "lost_interest",   label: "Lost interest",            emoji: "😶" },
  { key: "found_someone",   label: "Found someone else",       emoji: "💘" },
  { key: "inappropriate",   label: "Inappropriate behaviour",  emoji: "🚫" },
  { key: "no_response",     label: "They never responded",     emoji: "😴" },
  { key: "other",           label: "Something else",           emoji: "💬" },
];

const UnmatchReasonModal = ({ visible, name = "this person", onClose, onConfirm, loading: externalLoading }) => {
  const slideY = useRef(new Animated.Value(SH)).current;

  const [selectedReason, setReason] = useState(null);
  const [details, setDetails]       = useState("");
  const [screen, setScreen]         = useState("reasons"); // 'reasons' | 'detail' | 'confirm'

  // Reset on open
  useEffect(() => {
    if (visible) {
      setScreen("reasons");
      setReason(null);
      setDetails("");
      Animated.spring(slideY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 3,
        speed: 14,
      }).start();
    } else {
      Animated.timing(slideY, {
        toValue: SH,
        duration: 250,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleSelectReason = (reason) => {
    setReason(reason);
    if (reason.key === "other") {
      setScreen("detail");
    } else {
      setScreen("confirm");
    }
  };

  const handleConfirm = () => {
    onConfirm?.({
      reason: selectedReason?.key,
      details: details.trim() || undefined,
    });
  };

  const renderReasons = () => (
    <>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose} hitSlop={10}>
          <X size={22} color="#6B7280" />
        </TouchableOpacity>
        <Text style={s.title}>Why unmatch?</Text>
        <View style={{ width: 22 }} />
      </View>
      <Text style={s.subtitle}>
        Help us improve your experience. This is private.
      </Text>
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        {UNMATCH_REASONS.map((reason) => (
          <TouchableOpacity
            key={reason.key}
            style={s.reasonRow}
            activeOpacity={0.7}
            onPress={() => handleSelectReason(reason)}
          >
            <Text style={s.reasonEmoji}>{reason.emoji}</Text>
            <Text style={s.reasonLabel}>{reason.label}</Text>
            <ChevronRight size={18} color="#9CA3AF" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </>
  );

  const renderDetail = () => (
    <>
      <View style={s.header}>
        <TouchableOpacity onPress={() => setScreen("reasons")} hitSlop={10}>
          <X size={22} color="#6B7280" />
        </TouchableOpacity>
        <Text style={s.title}>Tell us more</Text>
        <View style={{ width: 22 }} />
      </View>
      <Text style={s.subtitle}>Optional — share more about what went wrong.</Text>
      <TextInput
        style={s.textInput}
        placeholder="Add details (optional)..."
        placeholderTextColor="#9CA3AF"
        value={details}
        onChangeText={setDetails}
        multiline
        maxLength={300}
      />
      <TouchableOpacity
        style={s.confirmBtn}
        activeOpacity={0.85}
        onPress={() => setScreen("confirm")}
      >
        <Text style={s.confirmBtnText}>Continue</Text>
      </TouchableOpacity>
    </>
  );

  const renderConfirm = () => (
    <>
      <View style={s.header}>
        <TouchableOpacity onPress={() => setScreen("reasons")} hitSlop={10}>
          <X size={22} color="#6B7280" />
        </TouchableOpacity>
        <Text style={s.title}>Unmatch {name}?</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={s.confirmBody}>
        <HeartCrack size={40} color="#EF4444" style={{ alignSelf: "center", marginBottom: 12 }} />
        <Text style={s.confirmText}>
          This will permanently remove your connection with {name}. All messages will be lost.
        </Text>
        {selectedReason && (
          <View style={s.reasonPill}>
            <Text style={s.reasonPillText}>
              {selectedReason.emoji}  {selectedReason.label}
            </Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[s.confirmBtn, s.dangerBtn]}
        activeOpacity={0.85}
        onPress={handleConfirm}
        disabled={externalLoading}
      >
        {externalLoading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={[s.confirmBtnText, { color: "#fff" }]}>Unmatch</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={s.cancelBtn}
        activeOpacity={0.7}
        onPress={onClose}
        disabled={externalLoading}
      >
        <Text style={s.cancelBtnText}>Cancel</Text>
      </TouchableOpacity>
    </>
  );

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose} />
      <Animated.View style={[s.sheet, { transform: [{ translateY: slideY }] }]}>
        {screen === "reasons" && renderReasons()}
        {screen === "detail" && renderDetail()}
        {screen === "confirm" && renderConfirm()}
      </Animated.View>
    </Modal>
  );
};

const s = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 36,
    maxHeight: SH * 0.7,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontFamily: "PlusJakartaSansBold",
    color: "#111",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans",
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 16,
  },
  scroll: { maxHeight: SH * 0.4 },
  reasonRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  reasonEmoji: { fontSize: 20, marginRight: 12 },
  reasonLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: "PlusJakartaSansMedium",
    color: "#1F2937",
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    fontFamily: "PlusJakartaSans",
    color: "#111",
    minHeight: 90,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  confirmBody: {
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  confirmText: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans",
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 14,
  },
  reasonPill: {
    backgroundColor: "#FEF2F2",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  reasonPillText: {
    fontSize: 13,
    fontFamily: "PlusJakartaSansMedium",
    color: "#DC2626",
  },
  confirmBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    marginTop: 8,
  },
  dangerBtn: {
    backgroundColor: "#EF4444",
  },
  confirmBtnText: {
    fontSize: 16,
    fontFamily: "PlusJakartaSansBold",
    color: "#fff",
  },
  cancelBtn: {
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 4,
  },
  cancelBtnText: {
    fontSize: 15,
    fontFamily: "PlusJakartaSansSemiBold",
    color: "#6B7280",
  },
});

export default UnmatchReasonModal;
