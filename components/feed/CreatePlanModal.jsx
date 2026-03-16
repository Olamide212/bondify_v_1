/**
 * CreatePlanModal.jsx  —  Full-screen modal to create a new Plan.
 *
 * Steps:
 *  1. Pick a status (I'm Free / Join Me)
 *  2. Add optional note / activity
 *  3. Pick expiry time (2h / 4h / 6h / 12h)
 *  4. Post
 */

import {
    Calendar,
    Clock,
    Sparkles,
    X
} from "lucide-react-native";
import { useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { colors } from "../../constant/colors";
import planService from "../../services/planService";
import BaseModal from "../modals/BaseModal";

const BRAND = colors.primary;

const STATUS_OPTIONS = [
  { key: "free", label: "I'm Free for Plans 🙌", emoji: "🙌", color: "#10B981", bg: "#ECFDF5" },
  { key: "join_me", label: "Join Me! 🎉", emoji: "🎉", color: BRAND, bg: "#F1ECFF" },
];

const EXPIRY_OPTIONS = [
  { hours: 2, label: "2 hrs" },
  { hours: 4, label: "4 hrs" },
  { hours: 6, label: "6 hrs" },
  { hours: 12, label: "12 hrs" },
];

export default function CreatePlanModal({ visible, onClose, onCreated }) {
  const [status, setStatus] = useState(null);
  const [note, setNote] = useState("");
  const [activity, setActivity] = useState("");
  const [expiryHours, setExpiryHours] = useState(6);
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setStatus(null);
    setNote("");
    setActivity("");
    setExpiryHours(6);
  };

  const handlePost = async () => {
    if (!status) return;
    setLoading(true);
    try {
      const res = await planService.createPlan({
        status,
        note: note.trim(),
        activity: activity.trim(),
        expiryHours,
      });
      if (res.success) {
        onCreated?.(res.data);
        reset();
        onClose();
      }
    } catch (_err) {
      // silent — could add toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal visible={visible} onClose={onClose} fullScreen>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={onClose} hitSlop={10}>
            <X size={24} color="#111" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Share Your Plans</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={s.body}
          keyboardShouldPersistTaps="handled"
        >
          {/* Step 1 — Pick status */}
          <Text style={s.sectionTitle}>What&apos;s your status?</Text>
          <View style={s.statusGrid}>
            {STATUS_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[
                  s.statusCard,
                  { borderColor: status === opt.key ? opt.color : "#E5E7EB" },
                  status === opt.key && { backgroundColor: opt.bg },
                ]}
                onPress={() => setStatus(opt.key)}
                activeOpacity={0.7}
              >
                <Text style={s.statusEmoji}>{opt.emoji}</Text>
                <Text
                  style={[
                    s.statusLabel,
                    status === opt.key && { color: opt.color },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Step 2 — Note */}
          <Text style={s.sectionTitle}>Add a note (optional)</Text>
          <TextInput
            style={s.input}
            placeholder="E.g. Free for coffee in Lekki ☕"
            placeholderTextColor="#BBB"
            value={note}
            onChangeText={setNote}
            maxLength={200}
            multiline
          />

          {/* Activity */}
          <Text style={s.sectionTitle}>Activity (optional)</Text>
          <View style={s.inputRow}>
            <Calendar size={18} color="#888" />
            <TextInput
              style={[s.input, { flex: 1, marginBottom: 0, marginLeft: 8 }]}
              placeholder="E.g. Coffee, Gym, Movies…"
              placeholderTextColor="#BBB"
              value={activity}
              onChangeText={setActivity}
              maxLength={60}
            />
          </View>

          {/* Step 3 — Expiry */}
          <Text style={[s.sectionTitle, { marginTop: 20 }]}>
            Expires in
          </Text>
          <View style={s.expiryRow}>
            {EXPIRY_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.hours}
                style={[
                  s.expiryChip,
                  expiryHours === opt.hours && s.expiryChipActive,
                ]}
                onPress={() => setExpiryHours(opt.hours)}
              >
                <Clock size={14} color={expiryHours === opt.hours ? "#fff" : "#666"} />
                <Text
                  style={[
                    s.expiryLabel,
                    expiryHours === opt.hours && s.expiryLabelActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Post button */}
        <View style={s.footer}>
          <TouchableOpacity
            style={[s.postBtn, !status && { opacity: 0.5 }]}
            onPress={handlePost}
            disabled={!status || loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Sparkles size={18} color="#fff" />
                <Text style={s.postBtnText}>Post Plan</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </BaseModal>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "PlusJakartaSansBold",
    color: "#111",
  },
  body: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: "PlusJakartaSansBold",
    color: "#111",
    marginBottom: 10,
    marginTop: 8,
  },
  statusGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  statusCard: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: "center",
    gap: 8,
  },
  statusEmoji: { fontSize: 32 },
  statusLabel: {
    fontSize: 13,
    fontFamily: "PlusJakartaSansBold",
    color: "#333",
    textAlign: "center",
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: "PlusJakartaSans",
    color: "#111",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    minHeight: 44,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
  },
  expiryRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  expiryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
  },
  expiryChipActive: {
    backgroundColor: BRAND,
  },
  expiryLabel: {
    fontSize: 13,
    fontFamily: "PlusJakartaSansMedium",
    color: "#666",
  },
  expiryLabelActive: {
    color: "#fff",
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  postBtn: {
    backgroundColor: BRAND,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  postBtnText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "PlusJakartaSansBold",
  },
});
