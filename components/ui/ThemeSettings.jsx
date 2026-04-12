/**
 * ThemeSettings.js
 *
 * App theme picker screen.
 * Three options: Light / Dark / System default.
 *
 * Visual style matches NotificationSettings — same header, card, section label,
 * and safe area treatment.
 *
 * Route: /theme-settings  (add to expo-router file at app/theme-settings.js)
 * Props: onBack (optional) — if omitted, uses router.back()
 */

import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import { useRouter } from "expo-router";

// ─── Option config ────────────────────────────────────────────────────────────

const THEME_OPTIONS = [
  {
    value: "light",
    label: "Light",
    description: "Clean white backgrounds, dark text",
    icon: "☀️",
  },
  {
    value: "dark",
    label: "Dark",
    description: "Dark surfaces, easy on the eyes at night",
    icon: "🌙",
  },
  {
    value: "system",
    label: "System default",
    description: "Follows your device's appearance setting",
    icon: "📱",
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionLabel = ({ label, colors }) => (
  <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>{label}</Text>
);

const ThemeOptionRow = ({ option, isSelected, isLast, onSelect, colors }) => (
  <>
    <TouchableOpacity
      style={styles.optionRow}
      onPress={() => onSelect(option.value)}
      activeOpacity={0.7}
    >
      {/* Icon bubble */}
      <View style={[styles.iconBubble, { backgroundColor: colors.divider }]}>
        <Text style={styles.iconText}>{option.icon}</Text>
      </View>

      {/* Text */}
      <View style={styles.optionTextBlock}>
        <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>
          {option.label}
        </Text>
        <Text style={[styles.optionDescription, { color: colors.textTertiary }]}>
          {option.description}
        </Text>
      </View>

      {/* Radio */}
      <View
        style={[
          styles.radio,
          {
            borderColor: isSelected ? colors.primary : colors.border,
            backgroundColor: isSelected ? colors.primary : "transparent",
          },
        ]}
      >
        {isSelected && <View style={styles.radioDot} />}
      </View>
    </TouchableOpacity>

    {!isLast && (
      <View style={[styles.divider, { backgroundColor: colors.divider }]} />
    )}
  </>
);

// ─── Screen ───────────────────────────────────────────────────────────────────

const ThemeSettings = ({ onBack }) => {
  const { theme, setTheme, resolvedScheme, colors, isDark } = useTheme();
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={["top", "left", "right"]}
    >
      <StatusBar
        barStyle={colors.statusBarStyle}
        backgroundColor={colors.surface}
      />

      {/* ── Header ── */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: colors.backButton }]}
          onPress={handleBack}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.backIcon, { color: colors.textPrimary }]}>‹</Text>
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Theme
        </Text>

        {/* Spacer to keep title centred */}
        <View style={styles.headerRight} />
      </View>

      {/* ── Body ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero card */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: colors.primaryLight,
              borderColor: colors.primaryBorder,
            },
          ]}
        >
          {/* Mini preview */}
          <View style={styles.previewRow}>
            {/* Light preview */}
            <View style={[styles.previewPhone, styles.previewLight]}>
              <View style={styles.previewBar} />
              <View style={[styles.previewBlock, { backgroundColor: "#E5E7EB" }]} />
              <View style={[styles.previewBlock, { backgroundColor: "#E5E7EB", width: "60%" }]} />
            </View>

            {/* Dark preview */}
            <View style={[styles.previewPhone, styles.previewDark]}>
              <View style={[styles.previewBar, { backgroundColor: "#3C3C3E" }]} />
              <View style={[styles.previewBlock, { backgroundColor: "#3C3C3E" }]} />
              <View style={[styles.previewBlock, { backgroundColor: "#3C3C3E", width: "60%" }]} />
            </View>
          </View>

          <View style={styles.heroTextBlock}>
            <Text style={[styles.heroLabel, { color: colors.primaryDark }]}>
              Appearance
            </Text>
            <Text style={[styles.heroDescription, { color: colors.primaryMuted }]}>
              {isDark
                ? "Dark mode is active. Tap an option below to change."
                : "Light mode is active. Tap an option below to change."}
            </Text>
          </View>
        </View>

        {/* Options */}
        <SectionLabel label="CHOOSE THEME" colors={colors} />
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              shadowColor: isDark ? "#000" : "#000",
            },
          ]}
        >
          {THEME_OPTIONS.map((option, i) => (
            <ThemeOptionRow
              key={option.value}
              option={option}
              isSelected={theme === option.value}
              isLast={i === THEME_OPTIONS.length - 1}
              onSelect={setTheme}
              colors={colors}
            />
          ))}
        </View>

        <Text style={[styles.footerNote, { color: colors.textTertiary }]}>
          Your preference is saved automatically and synced across the app.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
  },
  backIcon: {
    fontSize: 26,
    lineHeight: 30,
    marginTop: -2,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.3,
    fontFamily: "PlusJakartaSansBold",
  },
  headerRight: {
    width: 36,
    height: 36,
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 40,
  },

  // Hero card
  heroCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 28,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  previewRow: {
    flexDirection: "row",
    gap: 6,
    flexShrink: 0,
  },
  previewPhone: {
    width: 40,
    height: 56,
    borderRadius: 6,
    padding: 5,
    gap: 4,
    overflow: "hidden",
  },
  previewLight: {
    backgroundColor: "#121212",
    borderWidth: 1,
    borderColor: '#374151',
  },
  previewDark: {
    backgroundColor: "#1C1C1E",
    borderWidth: 1,
    borderColor: "#38383A",
  },
  previewBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D5DB",
    width: "100%",
  },
  previewBlock: {
    height: 6,
    borderRadius: 3,
    width: "100%",
  },
  heroTextBlock: {
    flex: 1,
  },
  heroLabel: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 3,
    fontFamily: "PlusJakartaSansBold",
  },
  heroDescription: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: "PlusJakartaSans",
  },

  // Section label
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
    fontFamily: "PlusJakartaSansBold",
  },

  // Card
  card: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 28,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
  },

  // Option row
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  iconBubble: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  iconText: {
    fontSize: 18,
  },
  optionTextBlock: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
    fontFamily: "PlusJakartaSansMedium",
  },
  optionDescription: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: "PlusJakartaSans",
  },

  // Radio button
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  radioDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#121212",
  },

  // Footer
  footerNote: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 8,
    fontFamily: "PlusJakartaSans",
  },
});

export default ThemeSettings;