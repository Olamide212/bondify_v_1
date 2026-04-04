/**
 * ReportProblem.js
 * Route: /report-problem
 */

import { useRouter } from "expo-router";
import { ArrowLeft, Camera, Info } from "lucide-react-native";
import { useState } from "react";
import {
    ScrollView, StatusBar,
    StyleSheet,
    Text, TextInput, TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../../constant/colors";
import { useAlert } from "../../../context/AlertContext";
import { useTheme } from "../../../context/ThemeContext";


const CATEGORIES = [
  "Select a category",
  "App crash / bug",
  "Account issue",
  "Billing problem",
  "Inappropriate content",
  "Match / messaging issue",
  "Other",
];

const ReportProblem = () => {
  const { colors } = useTheme();
  const { showAlert } = useAlert();
  const router = useRouter();
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [images, setImages] = useState([null]); // null = upload slot

  const handleSubmit = () => {
    if (category === CATEGORIES[0] || !description.trim()) {
      showAlert({
        icon: 'warning',
        title: 'Missing info',
        message: 'Please select a category and describe the problem.',
      });
      return;
    }
    showAlert({
      icon: 'success',
      title: 'Report submitted',
      message: 'Our team will review your report within 24 hours.',
    });
    router.back();
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.surface} />

      {/* Header */}
      <View style={[s.header, { backgroundColor: '#121212' }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <ArrowLeft size={22} color={colors.textPrimary} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.textPrimary }]}>Help Center</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        style={{ backgroundColor: '#121212' }}
        contentContainerStyle={[s.body, { backgroundColor: '#121212' }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <Text style={[s.heroTitle, { color: colors.textPrimary }]}>How can we help?</Text>
        <Text style={[s.heroSub, { color: colors.textSecondary }]}>
          We&apos;re sorry you&apos;re experiencing an issue. Your safety and experience on Bondies are our top priorities. Let us know what&apos;s happening.
        </Text>

        {/* Category */}
        <Text style={[s.fieldLabel, { color: colors.textPrimary }]}>What&apos;s the issue about?</Text>
        <TouchableOpacity
          style={[s.dropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setDropdownOpen((v) => !v)}
          activeOpacity={0.8}
        >
          <Text style={[s.dropdownText, { color: category === CATEGORIES[0] ? colors.textTertiary : colors.textPrimary }]}>
            {category}
          </Text>
          <Text style={{ color: colors.textTertiary, fontSize: 12 }}>▼</Text>
        </TouchableOpacity>
        {dropdownOpen && (
          <View style={[s.dropdownList, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {CATEGORIES.slice(1).map((c) => (
              <TouchableOpacity
                key={c}
                style={[s.dropdownItem, { borderBottomColor: colors.divider }]}
                onPress={() => { setCategory(c); setDropdownOpen(false); }}
              >
                <Text style={[s.dropdownItemText, { color: colors.textPrimary }]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Description */}
        <Text style={[s.fieldLabel, { color: colors.textPrimary, marginTop: 20 }]}>Describe the problem</Text>
        <TextInput
          style={[s.textarea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
          placeholder="Tell us more about what happened..."
          placeholderTextColor={colors.textTertiary}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          value={description}
          onChangeText={setDescription}
        />

        {/* Evidence */}
        <Text style={[s.fieldLabel, { color: colors.textPrimary, marginTop: 20 }]}>Add evidence (Optional)</Text>
        <View style={s.imageRow}>
          {/* Upload slot */}
          <TouchableOpacity style={[s.uploadSlot, { borderColor: colors.border }]}>
            <Camera size={22} color={colors.textTertiary} strokeWidth={1.5} />
            <Text style={[s.uploadLabel, { color: colors.textTertiary }]}>Upload</Text>
          </TouchableOpacity>
        </View>
        <Text style={[s.imageHint, { color: colors.textTertiary }]}>
          Maximum 3 screenshots. Formats: JPG, PNG.
        </Text>

        {/* Info banner */}
        <View style={[s.infoBanner, { backgroundColor: colors.primary + 10, borderColor: colors.primary}]}>
          <Info size={16} color={colors.primary} strokeWidth={2} style={{ marginTop: 1, flexShrink: 0 }} />
          <Text style={[s.infoText, { color: colors.textSecondary }]}>
            Our support team typically responds within 24 hours. If this is an urgent safety matter, please visit our{" "}
            <Text style={{ color: colors.primary }}>Safety Center</Text>.
          </Text>
        </View>

        {/* Submit */}
        <TouchableOpacity style={s.submitBtn} onPress={handleSubmit} activeOpacity={0.88}>
          <Text style={s.submitText}>Submit Report</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} style={s.cancelBtn}>
          <Text style={[s.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 18, fontFamily: "OutfitBold" },
  body: { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 60 },
  heroTitle: { fontSize: 26, fontFamily: "OutfitBold", letterSpacing: -0.5, marginBottom: 10 },
  heroSub: { fontSize: 14, fontFamily: "Outfit", lineHeight: 21, marginBottom: 28 },
  fieldLabel: { fontSize: 15, fontFamily: "OutfitBold", marginBottom: 10 },
  dropdown: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14,
  },
  dropdownText: { fontSize: 15, fontFamily: "Outfit" },
  dropdownList: {
    borderWidth: 1, borderRadius: 12, marginTop: 4, overflow: "hidden",
  },
  dropdownItem: { paddingHorizontal: 14, paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth },
  dropdownItemText: { fontSize: 14, fontFamily: "Outfit" },
  textarea: {
    borderWidth: 1, borderRadius: 12, padding: 14,
    fontSize: 14, fontFamily: "Outfit", minHeight: 120,
  },
  imageRow: { flexDirection: "row", gap: 10, marginBottom: 8 },
  uploadSlot: {
    width: 72, height: 72, borderRadius: 12, borderWidth: 1.5,
    borderStyle: "dashed", alignItems: "center", justifyContent: "center", gap: 4,
  },
  uploadLabel: { fontSize: 11, fontFamily: "Outfit" },
  imageHint: { fontSize: 12, fontFamily: "Outfit", marginBottom: 20 },
  infoBanner: {
    flexDirection: "row", gap: 10, borderRadius: 12, padding: 14,
    borderWidth: 1, marginBottom: 28,
  },
  infoText: { flex: 1, fontSize: 13, fontFamily: "Outfit", lineHeight: 19 },
  submitBtn: {
    backgroundColor: colors.primary, borderRadius: 50,
    paddingVertical: 16, alignItems: "center", marginBottom: 14,
  },
  submitText: { fontSize: 16, fontFamily: "OutfitBold", color: "#fff" },
  cancelBtn: { alignItems: "center", paddingVertical: 8 },
  cancelText: { fontSize: 15, fontFamily: "Outfit" },
});

export default ReportProblem;