
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Linking,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  MoreVertical,
  Search,
  User,
  Shield,
  CreditCard,
  Settings,
  ChevronDown,
  ChevronUp,
  Mail,
} from "lucide-react-native";
import { useTheme } from "../../../context/ThemeContext";
import GeneralHeader from "../../../components/headers/GeneralHeader";


// ─── Data ─────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  {
    id: "account",
    label: "Account & Profile",
    Icon: User,
    items: [
      { q: "How do I change my profile photo?", a: "Go to Profile → Edit Profile and tap your photo to upload a new one." },
      { q: "How do I update my email address?", a: "Navigate to Settings → Account → Update Email. You'll receive a verification link to your new address." },
      { q: "Can I have multiple accounts?", a: "No, Bondies allows one account per person to keep the community authentic." },
      { q: "How do I delete my account?", a: "Go to Settings → Account → Delete Account. This action is permanent and cannot be undone." },
    ],
  },
  {
    id: "safety",
    label: "Safety & Reporting",
    Icon: Shield,
    items: [
      { q: "How do I block someone?", a: "Open the chat or profile, tap the ⋮ menu and select Block. They won't be able to see or contact you." },
      { q: "How do I report a profile?", a: "Tap ⋮ on any profile or chat and select Report. Choose a reason and submit — our team reviews all reports." },
      { q: "Is my data kept private?", a: "Yes. We never sell your personal data. Review our Privacy Policy for full details on how your data is used." },
    ],
  },
  {
    id: "payments",
    label: "Subscription & Payments",
    Icon: CreditCard,
    items: [
      { q: "What's included in Bondies Premium?", a: "Premium includes unlimited likes, see who liked you, advanced filters, rewinds, and more." },
      { q: "How do I cancel my subscription?", a: "Manage your subscription through the App Store (iOS) or Google Play Store (Android) settings." },
      { q: "Can I get a refund?", a: "Refunds are handled by Apple or Google depending on your platform. Contact their support directly for refund requests." },
    ],
  },
  {
    id: "technical",
    label: "Technical Support",
    Icon: Settings,
    items: [
      { q: "The app keeps crashing. What should I do?", a: "Try force-closing the app and reopening it. If the issue persists, update to the latest version or reinstall." },
      { q: "My messages aren't sending.", a: "Check your internet connection. If the problem continues, log out and back in to refresh your session." },
      { q: "How do I enable push notifications?", a: "Go to your device Settings → Notifications → Bondies and enable Allow Notifications." },
    ],
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const CategoryAccordion = ({ category, colors }) => {
  const [open, setOpen] = useState(false);
  const [expandedItem, setExpandedItem] = useState(null);
  const { Icon } = category;

  return (
    <View style={[styles.accordion, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Category header */}
      <TouchableOpacity
        style={styles.accordionHeader}
        onPress={() => setOpen((v) => !v)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconBubble, { backgroundColor: "#FEF3EC" }]}>
          <Icon size={18} color="#E8651A" strokeWidth={1.8} />
        </View>
        <Text style={[styles.categoryLabel, { color: colors.textPrimary }]}>
          {category.label}
        </Text>
        {open
          ? <ChevronUp size={18} color={colors.textTertiary} />
          : <ChevronDown size={18} color={colors.textTertiary} />
        }
      </TouchableOpacity>

      {/* FAQ items */}
      {open && (
        <View style={[styles.faqList, { borderTopColor: colors.border }]}>
          {category.items.map((item, i) => {
            const isExpanded = expandedItem === i;
            const isLast = i === category.items.length - 1;
            return (
              <View key={i}>
                <TouchableOpacity
                  style={styles.faqItem}
                  onPress={() => setExpandedItem(isExpanded ? null : i)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.faqQuestion, { color: colors.textPrimary, flex: 1 }]}>
                    {item.q}
                  </Text>
                  {isExpanded
                    ? <ChevronUp size={15} color="#E8651A" />
                    : <ChevronDown size={15} color={colors.textTertiary} />
                  }
                </TouchableOpacity>
                {isExpanded && (
                  <View style={[styles.faqAnswer, { backgroundColor: colors.background }]}>
                    <Text style={[styles.faqAnswerText, { color: colors.textSecondary }]}>
                      {item.a}
                    </Text>
                  </View>
                )}
                {!isLast && (
                  <View style={[styles.faqDivider, { backgroundColor: colors.divider }]} />
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────

const FAQs = () => {
  const { colors } = useTheme();
  const router = useRouter();
  const [query, setQuery] = useState("");

  // Filter categories/items by search query
  const filtered = query.trim().length < 2
    ? CATEGORIES
    : CATEGORIES.map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item) =>
            item.q.toLowerCase().includes(query.toLowerCase()) ||
            item.a.toLowerCase().includes(query.toLowerCase())
        ),
      })).filter((cat) => cat.items.length > 0);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.surface }]} edges={["top"]}>
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.surface} />

      {/* ── Header ── */}
      
      <GeneralHeader title="Help & Support" onBack={() => router.back()} leftIcon={<ArrowLeft />} /> 
      

      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={[styles.scrollContent, { backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Hero text ── */}
        <View style={styles.hero}>
          <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>
            How can we help?
          </Text>
          <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
            Search our knowledge base or browse categories below.
          </Text>
        </View>

        {/* ── Search ── */}
        <View style={[styles.searchWrapper, { backgroundColor: "#FEF3EC" }]}>
          <Search size={18} color="#E8651A" strokeWidth={2} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search help articles..."
            placeholderTextColor={colors.textTertiary}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
        </View>

        {/* ── Categories ── */}
        <Text style={[styles.sectionLabel, { color: "#E8651A" }]}>CATEGORIES</Text>

        {filtered.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
            No results for &quot;{query}&quot;
          </Text>
        ) : (
          filtered.map((cat) => (
            <CategoryAccordion key={cat.id} category={cat} colors={colors} />
          ))
        )}

        {/* ── CTA card ── */}
        <View style={styles.ctaCard}>
          <Text style={styles.ctaTitle}>Still need help?</Text>
          <Text style={styles.ctaSubtitle}>
            Our support team is available 24/7 to assist you with any questions.
          </Text>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => Linking.openURL("mailto:support@bondies.app")}
            activeOpacity={0.85}
          >
            <Mail size={18} color="#E8651A" strokeWidth={2} />
            <Text style={styles.ctaButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "PlusJakartaSansBold",
    letterSpacing: -0.2,
  },

  // Scroll
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 60,
  },

  // Hero
  hero: { marginBottom: 20 },
  heroTitle: {
    fontSize: 26,
    fontFamily: "PlusJakartaSansBold",
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans",
    lineHeight: 20,
  },

  // Search
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 16,
    marginBottom: 28,
    gap: 10,
  },
  searchIcon: { flexShrink: 0 },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "PlusJakartaSans",
    padding: 0,
  },

  // Section label
  sectionLabel: {
    fontSize: 11,
    fontFamily: "PlusJakartaSansBold",
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 2,
  },

  // Accordion
  accordion: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 10,
    overflow: "hidden",
  },
  accordionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 16,
    gap: 12,
  },
  iconBubble: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  categoryLabel: {
    flex: 1,
    fontSize: 17,
    fontFamily: "PlusJakartaSansSemiBold",
  },

  // FAQ items
  faqList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
  },
  faqItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 10,
  },
  faqQuestion: {
    fontSize: 16,
    fontFamily: "PlusJakartaSansMedium",
    lineHeight: 20,
  },
  faqAnswer: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  faqAnswerText: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans",
    lineHeight: 19,
  },
  faqDivider: {
    height: StyleSheet.hairlineWidth,
  },

  // Empty state
  emptyText: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans",
    textAlign: "center",
    marginTop: 24,
    marginBottom: 8,
  },

  // CTA
  ctaCard: {
    marginTop: 20,
    backgroundColor: "#E8651A",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
  },
  ctaTitle: {
    fontSize: 18,
    fontFamily: "PlusJakartaSansBold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  ctaSubtitle: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans",
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 20,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 50,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  ctaButtonText: {
    fontSize: 15,
    fontFamily: "PlusJakartaSansBold",
    color: "#E8651A",
  },
});

export default FAQs;