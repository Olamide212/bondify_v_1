/**
 * DeleteAccountModal.js
 *
 * A two-step modal:
 *  1. Countdown screen — 10 s to change their mind, with a cancel button
 *  2. Confirm screen   — password input + optional reason, then calls deleteAccount
 *
 * Props:
 *   visible   {boolean}
 *   onClose   {() => void}
 *   onDeleted {() => void}  — called after successful deletion
 */

import { AlertTriangle, Eye, EyeOff, X } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useAlert } from "../../context/AlertContext";
import { useTheme } from "../../context/ThemeContext";
import SettingsService from "../../services/settingsService";

const COUNTDOWN_SECONDS = 10;

const REASONS = [
  "Found someone special 💜",
  "Taking a break",
  "Too many notifications",
  "Privacy concerns",
  "App issues",
  "Other",
];

// ─── Countdown ring ───────────────────────────────────────────────────────────

const CountdownRing = ({ seconds, total, colors }) => {
  const SIZE = 96;
  const STROKE = 5;
  const R = (SIZE - STROKE) / 2;
  const CIRCUMFERENCE = 2 * Math.PI * R;
  const progress = seconds / total;

  return (
    <View style={{ width: SIZE, height: SIZE, alignItems: "center", justifyContent: "center" }}>
      {/* Track */}
      <View
        style={{
          position: "absolute",
          width: SIZE,
          height: SIZE,
          borderRadius: SIZE / 2,
          borderWidth: STROKE,
          borderColor: colors.divider,
        }}
      />
      {/* We fake the arc using a rotating border trick */}
      <View
        style={{
          position: "absolute",
          width: SIZE,
          height: SIZE,
          borderRadius: SIZE / 2,
          borderWidth: STROKE,
          borderColor: "#E8651A",
          borderRightColor: "transparent",
          borderBottomColor: progress > 0.5 ? "#E8651A" : "transparent",
          transform: [{ rotate: `${(1 - progress) * 360}deg` }],
          opacity: seconds > 0 ? 1 : 0,
        }}
      />
      <Text style={{ fontSize: 28, fontFamily: "PlusJakartaSansBold", color: "#E8651A" }}>
        {seconds}
      </Text>
    </View>
  );
};

// ─── Main modal ───────────────────────────────────────────────────────────────

const DeleteAccountModal = ({ visible, onClose, onDeleted }) => {
  const { colors } = useTheme();
  const { showAlert } = useAlert();
  const [step, setStep] = useState("countdown"); // "countdown" | "confirm"
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [reason, setReason] = useState("");
  const [selectedReason, setSelectedReason] = useState(null);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Reset state whenever modal opens
  useEffect(() => {
    if (visible) {
      setStep("countdown");
      setSecondsLeft(COUNTDOWN_SECONDS);
      setPassword("");
      setReason("");
      setSelectedReason(null);
      setLoading(false);
    }
  }, [visible]);

  // Countdown tick
  useEffect(() => {
    if (!visible || step !== "countdown") return;
    if (secondsLeft <= 0) {
      setStep("confirm");
      return;
    }
    timerRef.current = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [visible, step, secondsLeft]);

  const handleCancel = useCallback(() => {
    clearTimeout(timerRef.current);
    onClose();
  }, [onClose]);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleDelete = async () => {
    if (!password.trim()) {
      shake();
      return;
    }
    setLoading(true);
    try {
      await SettingsService.deleteAccount({
        password: password.trim(),
        reason: selectedReason
          ? selectedReason === "Other" ? reason : selectedReason
          : undefined,
      });
      onDeleted();
    } catch (err) {
      const msg = err?.response?.data?.message ?? "Incorrect password. Please try again.";
      showAlert({
        icon: 'error',
        title: 'Could not delete account',
        message: msg,
      });
      shake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleCancel}
    >
      <View style={s.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ width: "100%" }}
        >
          <View style={[s.sheet, { backgroundColor: colors.surface }]}>

            {/* ── STEP 1: Countdown ── */}
            {step === "countdown" && (
              <>
                {/* Close */}
                <TouchableOpacity style={[s.closeBtn, { backgroundColor: colors.backButton }]} onPress={handleCancel}>
                  <X size={16} color={colors.textSecondary} strokeWidth={2.5} />
                </TouchableOpacity>

                <View style={[s.warningBubble, { backgroundColor: "#FEF3EC" }]}>
                  <AlertTriangle size={28} color="#E8651A" strokeWidth={2} />
                </View>

                <Text style={[s.countdownTitle, { color: colors.textPrimary }]}>
                  Are you sure?
                </Text>
                <Text style={[s.countdownSub, { color: colors.textSecondary }]}>
                  Deleting your account is permanent. All your matches, messages, and profile data will be lost forever.
                </Text>

                <CountdownRing seconds={secondsLeft} total={COUNTDOWN_SECONDS} colors={colors} />

                <Text style={[s.countdownHint, { color: colors.textTertiary }]}>
                  Continuing in {secondsLeft}s…
                </Text>

                <TouchableOpacity
                  style={[s.keepBtn, { backgroundColor: colors.primaryLight, borderColor: colors.primaryBorder }]}
                  onPress={handleCancel}
                  activeOpacity={0.8}
                >
                  <Text style={[s.keepBtnText, { color: colors.primary }]}>
                    Keep My Account
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => { clearTimeout(timerRef.current); setStep("confirm"); }}>
                  <Text style={[s.skipLink, { color: colors.textTertiary }]}>
                    Continue anyway
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* ── STEP 2: Confirm ── */}
            {step === "confirm" && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 8 }}
              >
                {/* Close */}
                <TouchableOpacity style={[s.closeBtn, { backgroundColor: colors.backButton }]} onPress={handleCancel}>
                  <X size={16} color={colors.textSecondary} strokeWidth={2.5} />
                </TouchableOpacity>

                <View style={[s.warningBubble, { backgroundColor: "#FEE2E2" }]}>
                  <AlertTriangle size={28} color="#EF4444" strokeWidth={2} />
                </View>

                <Text style={[s.confirmTitle, { color: "#EF4444" }]}>Delete Account</Text>
                <Text style={[s.confirmSub, { color: colors.textSecondary }]}>
                  This action cannot be undone. Enter your password to confirm.
                </Text>

                {/* Password */}
                <Text style={[s.fieldLabel, { color: colors.textPrimary }]}>Your password</Text>
                <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
                  <View style={[s.passwordRow, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                    <TextInput
                      style={[s.passwordInput, { color: colors.textPrimary }]}
                      placeholder="Enter your password"
                      placeholderTextColor={colors.textTertiary}
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity onPress={() => setShowPassword((v) => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      {showPassword
                        ? <EyeOff size={18} color={colors.textTertiary} strokeWidth={1.8} />
                        : <Eye size={18} color={colors.textTertiary} strokeWidth={1.8} />
                      }
                    </TouchableOpacity>
                  </View>
                </Animated.View>

                {/* Reason */}
                <Text style={[s.fieldLabel, { color: colors.textPrimary, marginTop: 18 }]}>
                  Reason for leaving{" "}
                  <Text style={{ color: colors.textTertiary, fontFamily: "PlusJakartaSans" }}>(optional)</Text>
                </Text>
                <View style={s.reasonGrid}>
                  {REASONS.map((r) => {
                    const active = selectedReason === r;
                    return (
                      <TouchableOpacity
                        key={r}
                        style={[
                          s.reasonChip,
                          {
                            backgroundColor: active ? "#FEF3EC" : colors.inputBackground,
                            borderColor: active ? "#E8651A" : colors.border,
                          },
                        ]}
                        onPress={() => setSelectedReason(active ? null : r)}
                        activeOpacity={0.7}
                      >
                        <Text style={[s.reasonText, { color: active ? "#E8651A" : colors.textSecondary }]}>
                          {r}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {selectedReason === "Other" && (
                  <TextInput
                    style={[s.otherInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.textPrimary }]}
                    placeholder="Tell us more…"
                    placeholderTextColor={colors.textTertiary}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    value={reason}
                    onChangeText={setReason}
                  />
                )}

                {/* Actions */}
                <TouchableOpacity
                  style={[s.deleteBtn, loading && { opacity: 0.7 }]}
                  onPress={handleDelete}
                  disabled={loading}
                  activeOpacity={0.88}
                >
                  {loading
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={s.deleteBtnText}>Delete My Account</Text>
                  }
                </TouchableOpacity>

                <TouchableOpacity style={s.cancelTouchable} onPress={handleCancel}>
                  <Text style={[s.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  sheet: {
    width: "100%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: Platform.OS === "ios" ? 40 : 28,
    alignItems: "center",
  },
  closeBtn: {
    position: "absolute",
    top: -4,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Countdown ──
  warningBubble: {
    width: 64, height: 64, borderRadius: 20,
    alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  countdownTitle: {
    fontSize: 24, fontFamily: "PlusJakartaSansBold", marginBottom: 10, textAlign: "center",
  },
  countdownSub: {
    fontSize: 14, fontFamily: "PlusJakartaSans", lineHeight: 20,
    textAlign: "center", marginBottom: 28, paddingHorizontal: 8,
  },
  countdownHint: {
    fontSize: 13, fontFamily: "PlusJakartaSans", marginTop: 12, marginBottom: 24,
  },
  keepBtn: {
    width: "100%", borderRadius: 50, borderWidth: 1.5,
    paddingVertical: 15, alignItems: "center", marginBottom: 12,
  },
  keepBtnText: { fontSize: 16, fontFamily: "PlusJakartaSansBold" },
  skipLink: { fontSize: 14, fontFamily: "PlusJakartaSans", paddingVertical: 8, textAlign: "center" },

  // ── Confirm ──
  confirmTitle: {
    fontSize: 22, fontFamily: "PlusJakartaSansBold", marginBottom: 10, textAlign: "center",
  },
  confirmSub: {
    fontSize: 14, fontFamily: "PlusJakartaSans", lineHeight: 20,
    textAlign: "center", marginBottom: 24, paddingHorizontal: 4,
  },
  fieldLabel: { alignSelf: "flex-start", fontSize: 14, fontFamily: "PlusJakartaSansBold", marginBottom: 8 },
  passwordRow: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13,
    width: "100%", gap: 8,
  },
  passwordInput: { flex: 1, fontSize: 15, fontFamily: "PlusJakartaSans", padding: 0 },
  reasonGrid: {
    flexDirection: "row", flexWrap: "wrap", gap: 8, width: "100%", marginBottom: 16,
  },
  reasonChip: {
    borderWidth: 1, borderRadius: 50, paddingHorizontal: 14, paddingVertical: 8,
  },
  reasonText: { fontSize: 13, fontFamily: "PlusJakartaSans" },
  otherInput: {
    width: "100%", borderWidth: 1, borderRadius: 12,
    padding: 12, fontSize: 14, fontFamily: "PlusJakartaSans",
    minHeight: 80, marginBottom: 16,
  },
  deleteBtn: {
    width: "100%", backgroundColor: "#EF4444",
    borderRadius: 50, paddingVertical: 15,
    alignItems: "center", marginTop: 4, marginBottom: 12,
  },
  deleteBtnText: { fontSize: 16, fontFamily: "PlusJakartaSansBold", color: "#fff" },
  cancelTouchable: { paddingVertical: 8 },
  cancelText: { fontSize: 15, fontFamily: "PlusJakartaSans", textAlign: "center" },
});

export default DeleteAccountModal;