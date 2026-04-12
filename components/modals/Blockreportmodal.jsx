/**
 * BlockReportModal.js
 *
 * A single bottom-sheet modal that handles both Block and Report flows.
 *
 * Usage:
 *   <BlockReportModal
 *     visible={modalVisible}
 *     mode="block" | "report"
 *     profile={profile}          // { id/_id, name/firstName, images }
 *     onClose={() => {}}
 *     onSuccess={(mode) => {}}   // called after successful block/report
 *   />
 */

import { AlertTriangle, Ban, ChevronRight, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../../constant/colors";
import { useAlert } from "../../context/AlertContext";
import SettingsService from "../../services/settingsService";
import BaseModal from "./BaseModal";

// ─── Report reasons — mirrors backend REPORT_REASONS enum ───────────────────

const REPORT_REASONS = [
  { key: "fake_profile",          label: "Fake profile",           emoji: "🎭" },
  { key: "inappropriate_content", label: "Inappropriate content",  emoji: "🚫" },
  { key: "harassment",            label: "Harassment",             emoji: "😡" },
  { key: "spam",                  label: "Spam",                   emoji: "📢" },
  { key: "underage",              label: "Underage user",          emoji: "⚠️" },
  { key: "other",                 label: "Something else",         emoji: "💬" },
];

// ─── Sub-screens ──────────────────────────────────────────────────────────────
// 'menu'        — initial choice: block or report
// 'block'       — block confirmation
// 'report'      — reason picker
// 'report_detail' — optional extra detail + submit
// 'success'     — done state

// ─────────────────────────────────────────────────────────────────────────────

const BlockReportModal = ({ visible, mode = "block", profile, onClose, onSuccess }) => {
  const { showAlert } = useAlert();

  const [screen, setScreen]             = useState(mode);
  const [selectedReason, setReason]     = useState(null);
  const [details, setDetails]           = useState("");
  const [loading, setLoading]           = useState(false);

  const name       = profile?.name || profile?.firstName || "this person";
  const targetId   = profile?._id  || profile?.id;

  // Reset when modal re-opens
  useEffect(() => {
    if (visible) {
      setScreen(mode);
      setReason(null);
      setDetails("");
      setLoading(false);
    }
  }, [visible, mode]);

  const close = () => onClose();

  const handleDone = (resultMode) => onSuccess?.(resultMode);

  // ── Block ───────────────────────────────────────────────────────────────────

  const handleBlock = async () => {
    if (!targetId) return;
    setLoading(true);
    try {
      await SettingsService.blockUser(targetId);
      setScreen("success_block");
    } catch (err) {
      close();
      setTimeout(() => {
        showAlert({
          icon: 'error',
          title: 'Error',
          message: err?.message || 'Could not block this user. Please try again.',
        });
      }, 300);
    } finally {
      setLoading(false);
    }
  };

  // ── Report ──────────────────────────────────────────────────────────────────

  const handleReport = async () => {
    if (!targetId || !selectedReason) return;
    setLoading(true);
    try {
      await SettingsService.reportUser(targetId, {
        reason:  selectedReason,
        details: details.trim(),
      });
      setScreen("success_report");
    } catch (err) {
      close();
      setTimeout(() => {
        showAlert({
          icon: 'error',
          title: 'Error',
          message: err?.message || 'Could not submit report. Please try again.',
        });
      }, 300);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────

  const renderContent = () => {
    // ── Block confirmation ──────────────────────────────────────────────────
    if (screen === "block") {
      return (
        <>
          <View style={styles.iconCircle}>
            <Ban size={32} color="#EF4444" />
          </View>
          <Text style={styles.title}>Block {name}?</Text>
          <Text style={styles.subtitle}>
            They won&apos;t be able to see your profile, send you messages, or appear in your
            matches. You can unblock them anytime in Settings → Blocked users.
          </Text>

          <View style={styles.bulletList}>
            {[
              "They won't see your profile",
              "Your conversations will be hidden",
              "They won't be notified",
            ].map((b) => (
              <View key={b} style={styles.bullet}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>{b}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.actionBtn, styles.blockBtn, loading && styles.btnDisabled]}
            onPress={handleBlock}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.actionBtnText}>Yes, block {name}</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={close}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </>
      );
    }

    // ── Report — reason picker ──────────────────────────────────────────────
    if (screen === "report") {
      return (
        <>
          <View style={styles.iconCircle}>
            <AlertTriangle size={32} color="#F59E0B" />
          </View>
          <Text style={styles.title}>Report {name}</Text>
          <Text style={styles.subtitle}>
            What&apos;s the issue? Your report is anonymous and helps keep Bondies safe.
          </Text>

          <View style={styles.reasonList}>
            {REPORT_REASONS.map((r) => {
              const active = selectedReason === r.key;
              return (
                <TouchableOpacity
                  key={r.key}
                  style={[styles.reasonRow, active && styles.reasonRowActive]}
                  onPress={() => setReason(r.key)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.reasonEmoji}>{r.emoji}</Text>
                  <Text style={[styles.reasonLabel, active && styles.reasonLabelActive]}>
                    {r.label}
                  </Text>
                  <View style={[styles.radioOuter, active && styles.radioOuterActive]}>
                    {active && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[
              styles.actionBtn,
              styles.reportBtn,
              (!selectedReason || loading) && styles.btnDisabled,
            ]}
            onPress={() => setScreen("report_detail")}
            disabled={!selectedReason}
          >
            <Text style={styles.actionBtnText}>Continue</Text>
            <ChevronRight size={18} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={close}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </>
      );
    }

    // ── Report — detail + submit ────────────────────────────────────────────
    if (screen === "report_detail") {
      return (
        <>
          <Text style={styles.title}>Any extra details?</Text>
          <Text style={styles.subtitle}>
            Optional — but extra context helps our team review your report faster.
          </Text>

          <TextInput
            style={styles.detailInput}
            placeholder="Describe what happened (optional)…"
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={500}
            value={details}
            onChangeText={setDetails}
          />
          <Text style={styles.charCount}>{details.length}/500</Text>

          <TouchableOpacity
            style={[styles.actionBtn, styles.reportBtn, loading && styles.btnDisabled]}
            onPress={handleReport}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.actionBtnText}>Submit report</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={() => setScreen("report")}>
            <Text style={styles.cancelText}>← Back</Text>
          </TouchableOpacity>
        </>
      );
    }

    // ── Success — block ─────────────────────────────────────────────────────
    if (screen === "success_block") {
      return (
        <>
          <Text style={{ fontSize: 48, textAlign: "center", marginBottom: 12 }}>🚫</Text>
          <Text style={styles.title}>{name} has been blocked</Text>
          <Text style={styles.subtitle}>
            They&apos;ll no longer be able to contact you or see your profile.
            You can manage blocked users in Settings.
          </Text>
          <TouchableOpacity style={[styles.actionBtn, styles.blockBtn]} onPress={() => handleDone("block")}>
            <Text style={styles.actionBtnText}>Done</Text>
          </TouchableOpacity>
        </>
      );
    }

    // ── Success — report ────────────────────────────────────────────────────
    if (screen === "success_report") {
      return (
        <>
          <Text style={{ fontSize: 48, textAlign: "center", marginBottom: 12 }}>✅</Text>
          <Text style={styles.title}>Report submitted</Text>
          <Text style={styles.subtitle}>
            Thanks for helping keep Bondies safe. Our team will review your report
            and take appropriate action.
          </Text>
          <TouchableOpacity style={[styles.actionBtn, styles.reportBtn]} onPress={() => handleDone("report")}>
            <Text style={styles.actionBtnText}>Done</Text>
          </TouchableOpacity>
        </>
      );
    }

    return null;
  };

  return (
    <BaseModal visible={visible} onClose={close} fullScreen>
      {/* Close button */}
      <View style={styles.sheetHeader}>
        <TouchableOpacity style={styles.closeCircle} onPress={close} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <X size={16} color="#fff" strokeWidth={2.5}  />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {renderContent()}
      </ScrollView>
    </BaseModal>
  );
};

const styles = StyleSheet.create({
  sheetHeader: {
    paddingTop: 14,
    paddingHorizontal: 20,
    paddingBottom: 4,
    alignItems: "flex-end",
    zIndex: 10,
  },
  closeCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E1E1E',
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 40,
    alignItems: "center",
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#2A1A1A',
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: "PlusJakartaSansBold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans",
    color: '#9CA3AF',
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  bulletList: {
    alignSelf: "stretch",
    backgroundColor: '#1E1E1E',
    borderRadius: 14,
    padding: 16,
    gap: 10,
    marginBottom: 24,
  },
  bullet:     { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  bulletDot:  { color: "#EF4444", fontSize: 16, lineHeight: 22 },
  bulletText: { flex: 1, fontSize: 14, fontFamily: "PlusJakartaSans", color: '#D1D5DB', lineHeight: 22 },

  // Reason list
  reasonList: { alignSelf: "stretch", gap: 8, marginBottom: 24 },
  reasonRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.whiteLight,
    backgroundColor: "#121212",
    gap: 12,
  },
  reasonRowActive:  { borderColor: colors.primary, backgroundColor: `${colors.primary}08` },
  reasonEmoji:      { fontSize: 20 },
  reasonLabel:      { flex: 1, fontSize: 15, fontFamily: "PlusJakartaSansMedium", color: '#D1D5DB' },
  reasonLabelActive:{ color: colors.primary },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#4B5563',
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterActive: { borderColor: colors.primary },
  radioInner:       { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },

  // Detail input
  detailInput: {
    alignSelf: "stretch",
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    fontFamily: "PlusJakartaSans",
    color: "#fff",
    minHeight: 110,
    maxHeight: 180,
    textAlignVertical: "top",
    marginBottom: 6,
  },
  charCount: {
    alignSelf: "flex-end",
    fontSize: 12,
    color: "#9CA3AF",
    fontFamily: "PlusJakartaSans",
    marginBottom: 20,
  },

  // Buttons
  actionBtn: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 50,
    marginBottom: 12,
  },
  blockBtn:       { backgroundColor: "#EF4444" },
  reportBtn:      { backgroundColor: colors.primary },
  btnDisabled:    { opacity: 0.45 },
  actionBtnText:  { color: "#fff", fontSize: 16, fontFamily: "PlusJakartaSansBold" },
  cancelBtn:      { paddingVertical: 10 },
  cancelText:     { fontSize: 15, fontFamily: "PlusJakartaSansMedium", color: '#9CA3AF' },
});

export default BlockReportModal;