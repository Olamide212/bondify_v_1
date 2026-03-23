import { ArrowLeft } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import GeneralHeader from "../../../components/headers/GeneralHeader";
import { colors } from "../../../constant/colors";
import { fonts } from "../../../constant/fonts";
import { useAlert } from "../../../context/AlertContext";
import SettingsService from "../../../services/settingsService";

// ─── Config ───────────────────────────────────────────────────────────────────

const VISIBILITY_OPTIONS = [
  {
    value: "everyone",
    label: "Everyone",
    description: "Any user on the app can view your profile",
  },
  {
    value: "matches_only",
    label: "Matches only",
    description: "Only people you've matched with can view your profile",
  },
  {
    value: "nobody",
    label: "Nobody",
    description: "Your profile is hidden from all users",
  },
];

// Keys mirror the `privacySettings` subdocument in the User model
const PROFILE_TOGGLES = [
  {
    key: "showLastActive",
    label: "Show last active",
    description: "Let others see when you were last online",
  },
  {
    key: "showDistance",
    label: "Show distance",
    description: "Display your approximate distance on your profile",
  },
  {
    key: "showAge",
    label: "Show age",
    description: "Show your age on your profile card",
  },
  {
    key: "showOnlineStatus",
    label: "Show online status",
    description: "Show a green dot when you're active",
  },
];

const CONTACT_TOGGLES = [
  {
    key: "allowMessageFromNonMatches",
    label: "Message requests",
    description: "Allow people you haven't matched with to send you a message request",
  },
];

const DEFAULT_SETTINGS = {
  profileVisibility: "everyone",
  showLastActive: true,
  showDistance: true,
  showAge: true,
  showOnlineStatus: true,
  allowMessageFromNonMatches: false,
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionLabel = ({ children }) => (
  <Text style={styles.sectionLabel}>{children}</Text>
);

const VisibilityCard = ({ option, selected, onSelect, disabled }) => (
  <TouchableOpacity
    style={[styles.visibilityCard, selected && styles.visibilityCardSelected]}
    onPress={() => !disabled && onSelect(option.value)}
    activeOpacity={0.7}
  >
    <View style={styles.visibilityCardRow}>
      <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
        {selected && <View style={styles.radioInner} />}
      </View>
      <View style={styles.visibilityTextBlock}>
        <Text style={[styles.visibilityLabel, selected && styles.visibilityLabelSelected]}>
          {option.label}
        </Text>
        <Text style={styles.visibilityDescription}>{option.description}</Text>
      </View>
    </View>
  </TouchableOpacity>
);

const ToggleRow = ({ setting, value, onChange, disabled }) => (
  <View style={styles.toggleRow}>
    <View style={styles.toggleTextBlock}>
      <Text style={styles.toggleLabel}>{setting.label}</Text>
      <Text style={styles.toggleDescription}>{setting.description}</Text>
    </View>
    <Switch
      value={Boolean(value)}
      onValueChange={(v) => onChange(setting.key, v)}
      disabled={disabled}
      trackColor={{ false: "#E5E7EB", true: colors.primary }}
      thumbColor={Platform.OS === "android" ? (value ? "#fff" : "#f4f3f4") : undefined}
      ios_backgroundColor="#E5E7EB"
    />
  </View>
);

// ─── Screen ───────────────────────────────────────────────────────────────────

const PrivacySettings = ({ onBack }) => {
  const { showAlert } = useAlert();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await SettingsService.getPrivacySettings();
        // Response: { success: true, data: { profileVisibility, showLastActive, ... } }
        if (mounted && res?.data) {
          setSettings((prev) => ({ ...prev, ...res.data }));
        }
      } catch {
        // keep defaults silently on network error
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const persist = async (key, patch) => {
    setSavingKey(key);
    // Snapshot for rollback
    const snapshot = settings[key];
    try {
      const res = await SettingsService.updatePrivacySettings(patch);
      // Response: { success: true, data: { profileVisibility, showLastActive, ... } }
      if (res?.data) {
        setSettings((prev) => ({ ...prev, ...res.data }));
      }
    } catch (error) {
      // Revert optimistic update to snapshot
      setSettings((prev) => ({ ...prev, [key]: snapshot }));
      showAlert({
        icon: 'error',
        title: "Couldn't save",
        message: error?.message || 'Please try again.',
        actions: [{ label: 'OK', style: 'primary' }],
      });
    } finally {
      setSavingKey(null);
    }
  };

  const handleVisibility = (value) => {
    setSettings((prev) => ({ ...prev, profileVisibility: value }));
    persist("profileVisibility", { profileVisibility: value });
  };

  const handleToggle = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    persist(key, { [key]: value });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
    
     <GeneralHeader onBack={onBack} title="Privacy Settings" leftIcon={<ArrowLeft />} />
        {/* <View style={styles.headerRight}>
          {savingKey !== null && (
            <ActivityIndicator size="small" color="#6366F1" />
          )}
        </View> */}
 

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Who can view your profile */}
        <SectionLabel>WHO CAN VIEW YOUR PROFILE</SectionLabel>
        <View style={styles.card}>
          {VISIBILITY_OPTIONS.map((option, i) => (
            <View key={option.value}>
              <VisibilityCard
                option={option}
                selected={settings.profileVisibility === option.value}
                onSelect={handleVisibility}
                disabled={savingKey === "profileVisibility"}
              />
              {i < VISIBILITY_OPTIONS.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        {/* What others can see */}
        <SectionLabel>WHAT OTHERS CAN SEE</SectionLabel>
        <View style={styles.card}>
          {PROFILE_TOGGLES.map((setting, i) => (
            <View key={setting.key}>
              <ToggleRow
                setting={setting}
                value={settings[setting.key]}
                onChange={handleToggle}
                disabled={savingKey === setting.key}
              />
              {i < PROFILE_TOGGLES.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        {/* How others can contact you */}
        <SectionLabel>HOW OTHERS CAN CONTACT YOU</SectionLabel>
        <View style={styles.card}>
          {CONTACT_TOGGLES.map((setting, i) => (
            <View key={setting.key}>
              <ToggleRow
                setting={setting}
                value={settings[setting.key]}
                onChange={handleToggle}
                disabled={savingKey === setting.key}
              />
              {i < CONTACT_TOGGLES.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        <Text style={styles.footerNote}>
          Changes are saved automatically. We never share your personal information with
          third parties.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fff",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
  },
  backIcon: {
    fontSize: 18,
    color: "#111827",
    lineHeight: 22,
  },
  headerTitle: {
    fontSize: 17,
 fontFamily: fonts.PlusJakartaSansBold,
    color: "#111827",
    letterSpacing: -0.3,
  },
  headerRight: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { flex: 1, backgroundColor: colors.background },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 40,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: fonts.PlusJakartaSansBold,
    color: colors.primary,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#F3F4F6",
    marginLeft: 16,
  },
  visibilityCard: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  visibilityCardSelected: {
    backgroundColor: colors.primaryLight,
  },
  visibilityCardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  radioOuterSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  visibilityTextBlock: {
    flex: 1,
  },
  visibilityLabel: {
    fontSize: 15,
fontFamily: fonts.PlusJakartaSansBold,
    color: "#374151",
    marginBottom: 2,
  },
  visibilityLabelSelected: {
    color: colors.primary,
  },
  visibilityDescription: {
    fontSize: 13,
    fontFamily: fonts.PlusJakartaSansMedium,
    color: colors.gray,
    lineHeight: 18,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  toggleTextBlock: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 15,
    fontFamily: fonts.PlusJakartaSansBold,
    color: "#111827",
    marginBottom: 2,
  },
  toggleDescription: {
    fontSize: 13,
    fontFamily: fonts.PlusJakartaSansMedium,
    color: colors.gray,
    lineHeight: 18,
  },
  footerNote: {
    fontSize: 12,
    fontFamily: fonts.PlusJakartaSans,
    color: colors.gray,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 8,
  },
});

export default PrivacySettings;