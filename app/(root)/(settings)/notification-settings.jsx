import { ArrowLeft, MessageCircle } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    View
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import GeneralHeader from "../../../components/headers/GeneralHeader";
import { colors } from "../../../constant/colors";
import { fonts } from "../../../constant/fonts";
import { useAlert } from "../../../context/AlertContext";
import { profileService } from "../../../services/profileService";
import SettingsService from "../../../services/settingsService";

// ─── Config ───────────────────────────────────────────────────────────────────

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
  newMatch:           true,
  newMessage:         true,
  newLike:            true,
  superLike:          true,
  eventReminder:      true,
  pushNotifications:  true,
  emailNotifications: true,
  marketingEmails:    false,
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
        trackColor={{ false: "#3A3A3A", true: colors.primary }}
        thumbColor={
          Platform.OS === "android" ? (value ? "#fff" : "#f4f3f4") : undefined
        }
        ios_backgroundColor="#3A3A3A"
      />
    </View>
    {!isLast && <View style={styles.divider} />}
  </>
);

// ─── Screen ───────────────────────────────────────────────────────────────────

const NotificationSettings = ({ onBack }) => {
  const { showAlert } = useAlert();
  const [settings,       setSettings]       = useState(DEFAULT_SETTINGS);
  const [isLoading,      setIsLoading]      = useState(true);
  const [savingKey,      setSavingKey]      = useState(null);
  const [whatsappOptIn,  setWhatsappOptIn]  = useState(false);
  const [savingWhatsapp, setSavingWhatsapp] = useState(false);

  // Load notification settings + whatsapp opt-in on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [notifRes, profile] = await Promise.all([
          SettingsService.getNotificationSettings(),
          profileService.getMyProfile(),
        ]);

        if (mounted) {
          if (notifRes?.data) {
            setSettings((prev) => ({ ...prev, ...notifRes.data }));
          }
          if (profile) {
            setWhatsappOptIn(Boolean(profile.whatsappOptIn));
          }
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
    const snapshot = settings[key];
    try {
      const res = await SettingsService.updateNotificationSettings(patch);
      if (res?.data) {
        setSettings((prev) => ({ ...prev, ...res.data }));
      }
    } catch (error) {
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

  const handleToggle = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value })); // optimistic
    persist(key, { [key]: value });
  };

  // Master switch — turns all activity notifications on/off at once
  const allPushEnabled = ACTIVITY_NOTIFICATIONS.every((s) => settings[s.key]);
  const handleMasterPush = (value) => {
    const patch = {};
    ACTIVITY_NOTIFICATIONS.forEach((s) => { patch[s.key] = value; });
    setSettings((prev) => ({ ...prev, ...patch }));
    persist("__master__", patch);
  };

  // WhatsApp opt-in toggle
  const handleWhatsappToggle = async (value) => {
    setWhatsappOptIn(value); // optimistic
    setSavingWhatsapp(true);
    try {
      await profileService.updateProfile({ whatsappOptIn: value });
    } catch (error) {
      setWhatsappOptIn(!value); // revert on failure
      showAlert({
        icon: 'error',
        title: "Couldn't save",
        message: error?.message || 'Please try again.',
        actions: [{ label: 'OK', style: 'primary' }],
      });
    } finally {
      setSavingWhatsapp(false);
    }
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
    <SafeAreaProvider style={{flex: 1}} className="bg-[#121212]">
      <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
        <StatusBar barStyle="light-content" backgroundColor="#121212" />

        <GeneralHeader
          onBack={onBack}
          title="Notifications"
          leftIcon={<ArrowLeft color='#fff' />}
          className="bg-background"
        />

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
              trackColor={{ false: "#3A3A3A", true: colors.primary }}
              thumbColor={
                Platform.OS === "android"
                  ? allPushEnabled ? "#fff" : "#f4f3f4"
                  : undefined
              }
              ios_backgroundColor="#3A3A3A"
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

          {/* WhatsApp opt-in */}
          <SectionLabel>WHATSAPP</SectionLabel>
          <View style={styles.card}>
            <View style={styles.toggleRow}>
              <View style={styles.whatsappIconWrap}>
                <MessageCircle size={20} color="#25D366" />
              </View>
              <View style={styles.toggleTextBlock}>
                <Text style={styles.toggleLabel}>WhatsApp notifications</Text>
                <Text style={styles.toggleDescription}>
                  Get notified on WhatsApp when you&apos;re offline
                </Text>
              </View>
              {savingWhatsapp ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Switch
                  value={whatsappOptIn}
                  onValueChange={handleWhatsappToggle}
                  disabled={savingWhatsapp}
                  trackColor={{ false: "#3A3A3A", true: "#25D366" }}
                  thumbColor={
                    Platform.OS === "android"
                      ? whatsappOptIn ? "#fff" : "#f4f3f4"
                      : undefined
                  }
                  ios_backgroundColor="#3A3A3A"
                />
              )}
            </View>
            {whatsappOptIn && (
              <View style={styles.whatsappNote}>
                <Text style={styles.whatsappNoteText}>
                  🔒 We only send notifications when you&apos;re offline. Reply{" "}
                  <Text style={{ fontFamily: fonts.OutfitBold }}>STOP</Text>{" "}
                  to any message to unsubscribe at any time.
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.footerNote}>
            You can also manage notifications in your device settings. Changes are
            saved automatically.
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
    backgroundColor: "#121212",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { flex: 1, backgroundColor: '#121212' },
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
  masterTextBlock: { flex: 1 },
  masterLabel: {
    fontSize: 15,
    fontFamily: fonts.OutfitBold,
    color: colors.white,
    marginBottom: 2,
  },
  masterDescription: {
    fontSize: 13,
    color: colors.white,
    lineHeight: 18,
  },

  // Section label
  sectionLabel: {
    fontSize: 20,
    fontFamily: fonts.OutfitBold,
    color: '#E5E5E5',
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'capitalize'
  },

  // Card
  card: {
    backgroundColor: "#121212",
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
    backgroundColor: colors.whiteLight,
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
  toggleTextBlock: { flex: 1 },
  toggleLabel: {
    fontSize: 15,
    fontFamily: fonts.OutfitBold,
    color: "#E5E5E5",
    marginBottom: 2,
  },
  toggleDescription: {
    fontSize: 13,
    fontFamily: fonts.OutfitMedium,
    color: "#9CA3AF",
    lineHeight: 18,
  },

  // WhatsApp
  whatsappIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(37, 211, 102, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  whatsappNote: {
    backgroundColor: "rgba(37, 211, 102, 0.12)",
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 10,
    padding: 12,
  },
  whatsappNoteText: {
    fontSize: 12,
    fontFamily: fonts.OutfitMedium,
    color: "#4ADE80",
    lineHeight: 18,
  },

  // Footer
  footerNote: {
    fontSize: 12,
    fontFamily: fonts.OutfitMedium,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 8,
  },
});

export default NotificationSettings;
