import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import SettingsService from "../../../services/settingsService";
import { colors } from "../../../constant/colors";
import { fonts } from "../../../constant/fonts";
import { ArrowLeft } from "lucide-react-native";
import GeneralHeader from "../../../components/headers/GeneralHeader";

// ─── Config ───────────────────────────────────────────────────────────────────
// Keys mirror the `notificationSettings` subdocument in the User model

const ACTIVITY_NOTIFICATIONS = [
  {
    key: "newMatch",
    label: "New match",
    description: "When someone matches with you",
  },
  {
    key: "newLike",
    label: "New like",
    description: "When someone likes your profile",
  },
  {
    key: "superLike",
    label: "Super like",
    description: "When someone super likes your profile",
  },
  {
    key: "newMessage",
    label: "New message",
    description: "When you receive a message from a match",
  },
  {
    key: "eventReminder",
    label: "Event reminders",
    description: "Reminders about upcoming events and features",
  },
];

const CHANNEL_NOTIFICATIONS = [
  {
    key: "pushNotifications",
    label: "Push notifications",
    description: "Receive alerts directly on your device",
  },
  {
    key: "emailNotifications",
    label: "Email notifications",
    description: "Get activity summaries sent to your email",
  },
  {
    key: "marketingEmails",
    label: "Marketing emails",
    description: "News, promotions and tips from Bondies",
  },
];

const DEFAULT_SETTINGS = {
  newMatch: true,
  newMessage: true,
  newLike: true,
  superLike: true,
  eventReminder: true,
  pushNotifications: true,
  emailNotifications: true,
  marketingEmails: false,
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionLabel = ({ children }) => (
  <Text style={styles.sectionLabel}>{children}</Text>
);

const ToggleRow = ({ setting, value, onChange, disabled, isLast }) => (
  <>
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
        thumbColor={
          Platform.OS === "android" ? (value ? "#fff" : "#f4f3f4") : undefined
        }
        ios_backgroundColor="#E5E7EB"
      />
    </View>
    {!isLast && <View style={styles.divider} />}
  </>
);

// ─── Screen ───────────────────────────────────────────────────────────────────

const NotificationSettings = ({ onBack }) => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await SettingsService.getNotificationSettings();
        // Response: { success: true, data: { newMatch, newMessage, ... } }
        if (mounted && res?.data) {
          setSettings((prev) => ({ ...prev, ...res.data }));
        }
      } catch {
        // keep defaults silently on network error
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const persist = async (key, patch) => {
    setSavingKey(key);
    const snapshot = settings[key];
    try {
      const res = await SettingsService.updateNotificationSettings(patch);
      // Response: { success: true, data: { newMatch, newMessage, ... } }
      if (res?.data) {
        setSettings((prev) => ({ ...prev, ...res.data }));
      }
    } catch (error) {
      setSettings((prev) => ({ ...prev, [key]: snapshot }));
      Alert.alert("Couldn't save", error?.message || "Please try again.");
    } finally {
      setSavingKey(null);
    }
  };

  const handleToggle = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value })); // optimistic
    persist(key, { [key]: value });
  };

  // Master switch — turns all push notifications on/off at once
  const allPushEnabled = ACTIVITY_NOTIFICATIONS.every((s) => settings[s.key]);
  const handleMasterPush = (value) => {
    const patch = {};
    ACTIVITY_NOTIFICATIONS.forEach((s) => {
      patch[s.key] = value;
    });
    setSettings((prev) => ({ ...prev, ...patch }));
    persist("__master__", patch);
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
    <SafeAreaProvider className='flex-1 bg-white'>
    <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
  
        <GeneralHeader onBack={onBack} title="Notification" leftIcon={<ArrowLeft />} className="bg-background" />
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
        {/* Master toggle */}
        <View style={styles.masterCard}>
          <View style={styles.masterTextBlock}>
            <Text style={styles.masterLabel}>Activity alerts</Text>
            <Text style={styles.masterDescription}>
              {allPushEnabled ? "All activity alerts are on" : "Some alerts are turned off"}
            </Text>
          </View>
          <Switch
            value={allPushEnabled}
            onValueChange={handleMasterPush}
            disabled={savingKey !== null}
            trackColor={{ false: "#E5E7EB", true: colors.primary }}
            thumbColor={
              Platform.OS === "android"
                ? allPushEnabled ? "#fff" : "#f4f3f4"
                : undefined
            }
            ios_backgroundColor="#E5E7EB"
          />
        </View>

        {/* Per-activity toggles */}
        <SectionLabel>ACTIVITY</SectionLabel>
        <View style={styles.card}>
          {ACTIVITY_NOTIFICATIONS.map((setting, i) => (
            <ToggleRow
              key={setting.key}
              setting={setting}
              value={settings[setting.key]}
              onChange={handleToggle}
              disabled={savingKey === setting.key}
              isLast={i === ACTIVITY_NOTIFICATIONS.length - 1}
            />
          ))}
        </View>

        {/* Channels */}
        <SectionLabel>CHANNELS</SectionLabel>
        <View style={styles.card}>
          {CHANNEL_NOTIFICATIONS.map((setting, i) => (
            <ToggleRow
              key={setting.key}
              setting={setting}
              value={settings[setting.key]}
              onChange={handleToggle}
              disabled={savingKey === setting.key}
              isLast={i === CHANNEL_NOTIFICATIONS.length - 1}
            />
          ))}
        </View>

        <Text style={styles.footerNote}>
          You can also manage notifications in your device settings. Changes are saved
          automatically.
        </Text>
      </ScrollView>
    </SafeAreaView>
    </SafeAreaProvider>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.background,
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

  // Scroll
  scroll: { flex: 1, backgroundColor: colors.background },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 40,
  },

  // Master toggle card
  masterCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.primaryLight,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 28,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.activePrimary,
  },
  masterTextBlock: {
    flex: 1,
  },
  masterLabel: {
    fontSize: 15,
    fontFamily: fonts.PlusJakartaSansBold,
    color: colors.activePrimary,
    marginBottom: 2,
  },
  masterDescription: {
    fontSize: 13,
    color: colors.activePrimary,
    lineHeight: 18,
  },

  // Section label
  sectionLabel: {
    fontSize: 11,
    fontFamily: fonts.PlusJakartaSansBold,
    color: colors.activePrimary,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },

  // Card
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

  // Toggle row
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
    color: "#9CA3AF",
    lineHeight: 18,
  },

  // Footer
  footerNote: {
    fontSize: 12,
    fontFamily: fonts.PlusJakartaSansMedium,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 8,
  },
});

export default NotificationSettings;