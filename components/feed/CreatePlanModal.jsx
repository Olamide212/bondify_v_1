/**
 * CreatePlanModal.jsx  —  Full-screen modal to create a new Plan.
 *
 * Steps:
 *  1. Pick a status (I'm Free / Join Me)
 *  2. Write a note (required)
 *  3. Pick an activity from a list
 *  4. Pick day(s) of the week
 *  5. Post
 */

import {
    Sparkles,
    X,
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
  { key: "free", label: "I'm Free 🙌", emoji: "🙌", color: "#10B981", bg: "#ECFDF5" },
  { key: "join_me", label: "Join Me! 🎉", emoji: "🎉", color: BRAND, bg: "#F1ECFF" },
];

const ACTIVITIES = [
  { key: "coffee", label: "☕ Coffee" },
  { key: "gym", label: "💪 Gym" },
  { key: "movies", label: "🎬 Movies" },
  { key: "food", label: "🍔 Food & Drinks" },
  { key: "study", label: "📚 Study" },
  { key: "walk", label: "🚶 Walk / Hike" },
  { key: "games", label: "🎮 Games" },
  { key: "shopping", label: "🛍️ Shopping" },
  { key: "sports", label: "⚽ Sports" },
  { key: "music", label: "🎵 Live Music" },
  { key: "beach", label: "🏖️ Beach" },
  { key: "hangout", label: "🛋️ Hangout" },
  { key: "travel", label: "✈️ Travel" },
  { key: "art", label: "🎨 Art / Museum" },
  { key: "other", label: "✨ Other" },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function CreatePlanModal({ visible, onClose, onCreated }) {
  const [status, setStatus] = useState(null);
  const [note, setNote] = useState("");
  const [activity, setActivity] = useState("");
  const [selectedDays, setSelectedDays] = useState([]);
  const [loading, setLoading] = useState(false);

  const toggleDay = (day) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const reset = () => {
    setStatus(null);
    setNote("");
    setActivity("");
    setSelectedDays([]);
  };

  const canPost = status && note.trim().length > 0;

  const handlePost = async () => {
    if (!canPost) return;
    setLoading(true);
    try {
      const res = await planService.createPlan({
        status,
        note: note.trim(),
        activity,
        days: selectedDays,
      });
      if (res.success) {
        onCreated?.(res.data);
        reset();
        onClose();
      }
    } catch (_err) {
      // silent
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

          {/* Step 2 — Note (required) */}
          <Text style={s.sectionTitle}>
            Add a note <Text style={s.required}>*</Text>
          </Text>
          <TextInput
            style={s.input}
            placeholder="E.g. Free for coffee in Lekki ☕"
            placeholderTextColor="#BBB"
            value={note}
            onChangeText={setNote}
            maxLength={200}
            multiline
          />

          {/* Step 3 — Activity (selectable list) */}
          <Text style={s.sectionTitle}>Pick an activity</Text>
          <View style={s.chipGrid}>
            {ACTIVITIES.map((a) => {
              const selected = activity === a.key;
              return (
                <TouchableOpacity
                  key={a.key}
                  style={[s.chip, selected && s.chipActive]}
                  onPress={() => setActivity(selected ? "" : a.key)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.chipText, selected && s.chipTextActive]}>
                    {a.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Step 4 — Days of the week */}
          <Text style={[s.sectionTitle, { marginTop: 20 }]}>
            Which day(s)?
          </Text>
          <View style={s.daysRow}>
            {DAYS.map((day) => {
              const selected = selectedDays.includes(day);
              return (
                <TouchableOpacity
                  key={day}
                  style={[s.dayChip, selected && s.dayChipActive]}
                  onPress={() => toggleDay(day)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.dayText, selected && s.dayTextActive]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Post button */}
        <View style={s.footer}>
          <TouchableOpacity
            style={[s.postBtn, !canPost && { opacity: 0.5 }]}
            onPress={handlePost}
            disabled={!canPost || loading}
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
  required: {
    color: "#EF4444",
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
    minHeight: 60,
    textAlignVertical: "top",
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    borderWidth: 1.5,
    borderColor: "#F3F4F6",
  },
  chipActive: {
    backgroundColor: "#F1ECFF",
    borderColor: BRAND,
  },
  chipText: {
    fontSize: 13,
    fontFamily: "PlusJakartaSansMedium",
    color: "#555",
  },
  chipTextActive: {
    color: BRAND,
    fontFamily: "PlusJakartaSansBold",
  },
  daysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
  },
  dayChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    borderWidth: 1.5,
    borderColor: "#F3F4F6",
  },
  dayChipActive: {
    backgroundColor: BRAND,
    borderColor: BRAND,
  },
  dayText: {
    fontSize: 13,
    fontFamily: "PlusJakartaSansBold",
    color: "#666",
  },
  dayTextActive: {
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
