import AsyncStorage from "@react-native-async-storage/async-storage";
import { ArrowLeft, Bell, ChevronRight, MessageSquare, Shield, Sparkles, Trash2 } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
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
import { useAlert } from "../../../context/AlertContext";
import { fonts } from "../../../constant/fonts";
import SettingsService from "../../../services/settingsService";

// ─── Config ───────────────────────────────────────────────────────────────────

const BRAND_ORANGE = "#EE5F2B";

const CONVERSATION_STYLES = [
  { key: "casual", label: "Casual" },
  { key: "witty",  label: "Witty"  },
  { key: "deep",   label: "Deep"   },
];

const DEFAULT_SETTINGS = {
  conversationStyle:       "witty",
  showIcebreakers:         true,
  profileTips:             true,
  personalizedSuggestions: true,
  aiUpdates:               true,
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionLabel = ({ children }) => (
  <Text style={styles.sectionLabel}>{children}</Text>
);

const ToggleRow = ({ icon: Icon, iconColor, label, description, value, onChange, disabled, isLast }) => (
  <>
    <View style={styles.toggleRow}>
      {Icon && (
        <View style={[styles.iconWrap, { backgroundColor: `${iconColor || BRAND_ORANGE}15` }]}>
          <Icon size={18} color={iconColor || BRAND_ORANGE} />
        </View>
      )}
      <View style={styles.toggleTextBlock}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {description && <Text style={styles.toggleDescription}>{description}</Text>}
      </View>
      <Switch
        value={Boolean(value)}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: "#E5E7EB", true: BRAND_ORANGE }}
        thumbColor={
          Platform.OS === "android" ? (value ? "#fff" : "#f4f3f4") : undefined
        }
        ios_backgroundColor="#E5E7EB"
      />
    </View>
    {!isLast && <View style={styles.divider} />}
  </>
);

const ActionRow = ({ icon: Icon, iconColor, label, description, onPress, isLast }) => (
  <>
    <Pressable style={styles.actionRow} onPress={onPress}>
      {Icon && (
        <View style={[styles.iconWrap, { backgroundColor: `${iconColor || "#6B7280"}15` }]}>
          <Icon size={18} color={iconColor || "#6B7280"} />
        </View>
      )}
      <View style={styles.toggleTextBlock}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {description && <Text style={styles.toggleDescription}>{description}</Text>}
      </View>
      <ChevronRight size={20} color="#9CA3AF" />
    </Pressable>
    {!isLast && <View style={styles.divider} />}
  </>
);

const StyleSelector = ({ currentStyle, onSelect, disabled }) => (
  <View style={styles.card}>
    <View style={styles.styleRow}>
      <View style={styles.styleRowLeft}>
        <View style={[styles.iconWrap, { backgroundColor: `${BRAND_ORANGE}15` }]}>
          <MessageSquare size={18} color={BRAND_ORANGE} />
        </View>
        <Text style={styles.toggleLabel}>Conversation Style</Text>
      </View>
      <Text style={styles.styleValueText}>{CONVERSATION_STYLES.find(s => s.key === currentStyle)?.label || 'Witty'}</Text>
    </View>
    <View style={styles.styleButtonsContainer}>
      {CONVERSATION_STYLES.map((style) => (
        <Pressable
          key={style.key}
          style={[
            styles.styleButton,
            currentStyle === style.key && styles.styleButtonActive,
          ]}
          onPress={() => onSelect(style.key)}
          disabled={disabled}
        >
          <Text
            style={[
              styles.styleButtonText,
              currentStyle === style.key && styles.styleButtonTextActive,
            ]}
          >
            {style.label}
          </Text>
        </Pressable>
      ))}
    </View>
  </View>
);

// ─── Screen ───────────────────────────────────────────────────────────────────

const AISettings = ({ onBack }) => {
  const { showAlert } = useAlert();
  const [settings, setSettings]   = useState(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);

  // Load AI settings on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await SettingsService.getAISettings();
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
    const snapshot = settings[key];
    try {
      const res = await SettingsService.updateAISettings(patch);
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

  const handleStyleChange = (style) => {
    if (style === settings.conversationStyle) return;
    setSettings((prev) => ({ ...prev, conversationStyle: style })); // optimistic
    persist("conversationStyle", { conversationStyle: style });
  };

  const handleClearHistory = () => {
    showAlert({
      icon: 'warning',
      title: 'Clear Chat History?',
      message: 'This will delete all your conversations with Bondies AI. This action cannot be undone.',
      actions: [
        { label: 'Cancel', style: 'secondary' },
        {
          label: 'Clear',
          style: 'danger',
          onPress: async () => {
            try {
              // Clear local storage chat history
              await AsyncStorage.removeItem('@bondify/ai_chat_history');
              // Also call API to clear server-side if needed
              await SettingsService.clearAIChatHistory();
              showAlert({
                icon: 'success',
                title: 'Cleared',
                message: 'Your chat history has been cleared.',
                actions: [{ label: 'OK', style: 'primary' }],
              });
            } catch (error) {
              showAlert({
                icon: 'error',
                title: 'Error',
                message: error?.message || 'Could not clear chat history. Please try again.',
                actions: [{ label: 'OK', style: 'primary' }],
              });
            }
          },
        },
      ],
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={BRAND_ORANGE} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaProvider className="flex-1 bg-white">
      <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />

        <GeneralHeader
          onBack={onBack}
          title="AI Assistant Settings"
          leftIcon={<ArrowLeft />}
          className="bg-background"
        />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ASSISTANT PREFERENCES */}
          <SectionLabel>ASSISTANT PREFERENCES</SectionLabel>

          {/* Conversation Style Selector */}
          <StyleSelector
            currentStyle={settings.conversationStyle}
            onSelect={handleStyleChange}
            disabled={savingKey === "conversationStyle"}
          />

          {/* Icebreakers and Profile Tips */}
          <View style={styles.card}>
            <ToggleRow
              icon={Sparkles}
              iconColor={BRAND_ORANGE}
              label="Show Icebreakers"
              description="Prompts for new matches"
              value={settings.showIcebreakers}
              onChange={(v) => handleToggle("showIcebreakers", v)}
              disabled={savingKey === "showIcebreakers"}
              isLast={false}
            />
            <ToggleRow
              icon={Sparkles}
              iconColor={BRAND_ORANGE}
              label="Profile Tips"
              description="AI feedback on photos/bio"
              value={settings.profileTips}
              onChange={(v) => handleToggle("profileTips", v)}
              disabled={savingKey === "profileTips"}
              isLast={true}
            />
          </View>

          {/* PRIVACY & DATA */}
          <SectionLabel>PRIVACY & DATA</SectionLabel>
          <View style={styles.card}>
            <ToggleRow
              icon={Shield}
              iconColor={BRAND_ORANGE}
              label="Personalized Suggestions"
              description="Allow AI to learn from your swiping habits"
              value={settings.personalizedSuggestions}
              onChange={(v) => handleToggle("personalizedSuggestions", v)}
              disabled={savingKey === "personalizedSuggestions"}
              isLast={false}
            />
            <ActionRow
              icon={Trash2}
              iconColor="#6B7280"
              label="Clear Chat History"
              onPress={handleClearHistory}
              isLast={true}
            />
          </View>

          {/* NOTIFICATIONS */}
          <SectionLabel>NOTIFICATIONS</SectionLabel>
          <View style={styles.card}>
            <ToggleRow
              icon={Bell}
              iconColor={BRAND_ORANGE}
              label="AI Updates"
              description="New opening lines & improvements"
              value={settings.aiUpdates}
              onChange={(v) => handleToggle("aiUpdates", v)}
              disabled={savingKey === "aiUpdates"}
              isLast={true}
            />
          </View>

          {/* Footer Note */}
          <Text style={styles.footerNote}>
            Bondies AI helps you make better connections. Your data is encrypted and used only to improve your experience.{" "}
            <Text style={styles.footerLink}>Learn more</Text>
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
    backgroundColor: "#fff",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { flex: 1, backgroundColor: colors.background },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 40,
  },

  // Section label
  sectionLabel: {
    fontSize: 11,
    fontFamily: fonts.PlusJakartaSansBold,
    color: BRAND_ORANGE,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },

  // Card
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 24,
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

  // Icon wrap
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  // Toggle row
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 0,
  },
  toggleTextBlock: { flex: 1 },
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

  // Action row (for Clear Chat History)
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 0,
  },

  // Style selector
  styleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  styleRowLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  styleValueText: {
    fontSize: 15,
    fontFamily: fonts.PlusJakartaSansBold,
    color: BRAND_ORANGE,
  },
  styleButtonsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 8,
  },
  styleButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  styleButtonActive: {
    backgroundColor: BRAND_ORANGE,
  },
  styleButtonText: {
    fontSize: 14,
    fontFamily: fonts.PlusJakartaSansMedium,
    color: "#374151",
  },
  styleButtonTextActive: {
    color: "#fff",
    fontFamily: fonts.PlusJakartaSansBold,
  },

  // Footer
  footerNote: {
    fontSize: 12,
    fontFamily: fonts.PlusJakartaSansMedium,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 8,
    marginTop: 8,
  },
  footerLink: {
    color: BRAND_ORANGE,
    fontFamily: fonts.PlusJakartaSansBold,
  },
});

export default AISettings;
