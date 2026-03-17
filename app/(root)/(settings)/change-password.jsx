/**
 * ChangePassword.js
 * Route: /change-password
 *
 * Three fields: current password, new password, confirm new password.
 * Inline validation + server error handling.
 * Full useTheme support.
 */

import React, { useState, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, StatusBar,
  ActivityIndicator, Animated, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Eye, EyeOff, ShieldCheck, CheckCircle } from "lucide-react-native";
import { useTheme } from "../../../context/ThemeContext";
import SettingsService from "../../../services/settingsService";
import {colors} from "../../../constant/colors";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const RULES = [
  { id: "length",  label: "At least 8 characters",          test: (v) => v.length >= 8 },
  { id: "upper",   label: "One uppercase letter",            test: (v) => /[A-Z]/.test(v) },
  { id: "number",  label: "One number",                      test: (v) => /[0-9]/.test(v) },
  { id: "special", label: "One special character (!@#$…)",   test: (v) => /[^A-Za-z0-9]/.test(v) },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const PasswordField = ({ label, value, onChange, placeholder, showToggle, onToggle, error, colors }) => (
  <View style={{ marginBottom: 20 }}>
    <Text style={[s.fieldLabel, { color: colors.textPrimary }]}>{label}</Text>
    <View
      style={[
        s.inputRow,
        {
          backgroundColor: colors.inputBackground,
          borderColor: error ? "#EF4444" : colors.border,
        },
      ]}
    >
      <TextInput
        style={[s.input, { color: colors.textPrimary }]}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        secureTextEntry={!showToggle}
        value={value}
        onChangeText={onChange}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TouchableOpacity
        onPress={onToggle}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {showToggle
          ? <EyeOff size={18} color={colors.textTertiary} strokeWidth={1.8} />
          : <Eye size={18} color={colors.textTertiary} strokeWidth={1.8} />
        }
      </TouchableOpacity>
    </View>
    {error && <Text style={s.errorText}>{error}</Text>}
  </View>
);

const StrengthRule = ({ rule, value, colors }) => {
  const passed = rule.test(value);
  return (
    <View style={s.ruleRow}>
      <CheckCircle
        size={14}
        color={passed ? "#22C55E" : colors.textTertiary}
        strokeWidth={2.5}
      />
      <Text style={[s.ruleText, { color: passed ? "#22C55E" : colors.textTertiary }]}>
        {rule.label}
      </Text>
    </View>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────

const ChangePassword = () => {
  const { colors } = useTheme();
  const router = useRouter();

  const [current, setCurrent]         = useState("");
  const [next, setNext]               = useState("");
  const [confirm, setConfirm]         = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors]           = useState({});
  const [loading, setLoading]         = useState(false);
  const [success, setSuccess]         = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8,  duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,  duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,  duration: 55, useNativeDriver: true }),
    ]).start();
  };

  // ── Client-side validation ────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!current.trim())        e.current = "Current password is required";
    if (!next.trim())           e.next = "New password is required";
    else if (next.length < 8)   e.next = "Must be at least 8 characters";
    else if (next === current)  e.next = "Must differ from your current password";
    if (!confirm.trim())        e.confirm = "Please confirm your new password";
    else if (confirm !== next)  e.confirm = "Passwords do not match";
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      shake();
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      await SettingsService.changePassword({
        currentPassword: current,
        newPassword: next,
        confirmPassword: confirm,
      });
      setSuccess(true);
      setTimeout(() => router.back(), 1800);
    } catch (err) {
      const msg = err?.response?.data?.message ?? "Something went wrong. Please try again.";
      if (msg.toLowerCase().includes("current") || msg.toLowerCase().includes("incorrect")) {
        setErrors({ current: msg });
      } else {
        setErrors({ general: msg });
      }
      shake();
    } finally {
      setLoading(false);
    }
  };

  const allRulesPassed = RULES.every((r) => r.test(next));

  // ── Success state ─────────────────────────────────────────────
  if (success) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={["top"]}>
        <View style={s.successContainer}>
          <View style={[s.successIcon, { backgroundColor: "#DCFCE7" }]}>
            <ShieldCheck size={36} color="#22C55E" strokeWidth={2} />
          </View>
          <Text style={[s.successTitle, { color: colors.textPrimary }]}>Password changed!</Text>
          <Text style={[s.successSub, { color: colors.textSecondary }]}>
            Your password has been updated successfully.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.surface }]} edges={["top"]}>
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.surface} />

      {/* Header */}
      <View style={[s.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <ArrowLeft size={22} color={colors.textPrimary} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.textPrimary }]}>Change Password</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={[s.body, { backgroundColor: colors.background, paddingBottom: 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
      
        <Text style={[s.pageTitle, { color: colors.textPrimary }]}>Update your password</Text>
        <Text style={[s.pageSub, { color: colors.textSecondary }]}>
          Choose a strong password you haven&apos;t used before.
        </Text>

        <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
          {/* General error */}
          {errors.general && (
            <View style={[s.generalError, { backgroundColor: "#FEE2E2", borderColor: "#FECACA" }]}>
              <Text style={s.generalErrorText}>{errors.general}</Text>
            </View>
          )}

          <PasswordField
            label="Current password"
            value={current}
            onChange={setCurrent}
            placeholder="Enter current password"
            showToggle={showCurrent}
            onToggle={() => setShowCurrent((v) => !v)}
            error={errors.current}
            colors={colors}
          />

          <PasswordField
            label="New password"
            value={next}
            onChange={(v) => { setNext(v); setErrors((e) => ({ ...e, next: undefined })); }}
            placeholder="Enter new password"
            showToggle={showNext}
            onToggle={() => setShowNext((v) => !v)}
            error={errors.next}
            colors={colors}
          />

          {/* Strength rules — shown while typing */}
          {/* {next.length > 0 && (
            <View style={[s.rulesCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {RULES.map((r) => <StrengthRule key={r.id} rule={r} value={next} colors={colors} />)}
            </View>
          )} */}

          <PasswordField
            label="Confirm new password"
            value={confirm}
            onChange={(v) => { setConfirm(v); setErrors((e) => ({ ...e, confirm: undefined })); }}
            placeholder="Re-enter new password"
            showToggle={showConfirm}
            onToggle={() => setShowConfirm((v) => !v)}
            error={errors.confirm}
            colors={colors}
          />
        </Animated.View>

        {/* Save button */}

        <TouchableOpacity
          style={[s.saveBtn, (!allRulesPassed || loading) && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.88}
        >
          {loading
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={s.saveBtnText}>Save New Password</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 18, fontFamily: "PlusJakartaSansBold" },
  body: { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 60 },
  iconBubble: {
    width: 60, height: 60, borderRadius: 16,
    alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  pageTitle: { fontSize: 22, fontFamily: "PlusJakartaSansBold", letterSpacing: -0.4, marginBottom: 8 },
  pageSub: { fontSize: 14, fontFamily: "PlusJakartaSans", lineHeight: 20, marginBottom: 28 },

  generalError: {
    borderRadius: 10, borderWidth: 1,
    padding: 12, marginBottom: 16,
  },
  generalErrorText: { fontSize: 13, fontFamily: "PlusJakartaSans", color: "#EF4444" },

  fieldLabel: { fontSize: 14, fontFamily: "PlusJakartaSansBold", marginBottom: 8 },
  inputRow: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13, gap: 8,
  },
  input: { flex: 1, fontSize: 15, fontFamily: "PlusJakartaSans", padding: 0 },
  errorText: { fontSize: 12, fontFamily: "PlusJakartaSans", color: "#EF4444", marginTop: 5 },

  rulesCard: {
    borderRadius: 12, borderWidth: StyleSheet.hairlineWidth,
    padding: 14, marginBottom: 20, gap: 8,
  },
  ruleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  ruleText: { fontSize: 12, fontFamily: "PlusJakartaSans" },

  saveBtn: {
    backgroundColor: colors.primary, borderRadius: 50,
    paddingVertical: 16, alignItems: "center", marginTop: 8,
  },
  saveBtnText: { fontSize: 16, fontFamily: "PlusJakartaSansBold", color: "#fff" },

  // Success
  successContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  successIcon: {
    width: 80, height: 80, borderRadius: 24,
    alignItems: "center", justifyContent: "center", marginBottom: 20,
  },
  successTitle: { fontSize: 24, fontFamily: "PlusJakartaSansBold", marginBottom: 10 },
  successSub: { fontSize: 15, fontFamily: "PlusJakartaSans", textAlign: "center", lineHeight: 22 },
});

export default ChangePassword;