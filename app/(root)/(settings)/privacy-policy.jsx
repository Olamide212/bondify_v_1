/**
 * PrivacyPolicy.js
 * Route: /privacy-policy
 */

import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowLeft, ShieldCheck, Users, Database,
  Share2, CheckSquare, Cookie, ChevronDown, ChevronUp, ExternalLink,
} from "lucide-react-native";
import { useTheme } from "../../../context/ThemeContext";
import GeneralHeader from "../../../components/headers/GeneralHeader";
import { colors } from "../../../constant/colors";

const SECTIONS = [
  {
    id: "collect",
    Icon: Database,
    title: "Information We Collect",
    content: "We collect information you provide directly to us:",
    bullets: [
      "Account profile details (name, age, gender)",
      "Photos and media uploaded to your profile",
      "Messages and interactions with other users",
      "Location data to suggest nearby matches",
    ],
  },
  {
    id: "use",
    Icon: Users,
    title: "How We Use Your Data",
    content: "We use the information we collect to provide, maintain, and improve our services, suggest compatible matches, ensure community safety, and personalise your experience on Bondies.",
  },
  {
    id: "share",
    Icon: Share2,
    title: "Sharing Your Information",
    content: "We do not sell your personal data. We may share information with trusted service providers who assist us in operating the app, subject to strict confidentiality agreements.",
  },
  {
    id: "rights",
    Icon: CheckSquare,
    title: "Your Rights & Choices",
    content: "You have the right to access, correct, or delete your personal data at any time. You can manage your privacy preferences in Settings → Privacy.",
  },
  {
    id: "cookies",
    Icon: Cookie,
    title: "Cookies Policy",
    content: "We use cookies and similar technologies to improve your experience. You can manage cookie preferences in Settings → Cookie Policy.",
  },
];

const AccordionSection = ({ section, colors, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  const { Icon } = section;

  return (
    <View style={[acc.wrapper, { borderBottomColor: colors.border }]}>
      <TouchableOpacity style={acc.header} onPress={() => setOpen((v) => !v)} activeOpacity={0.7}>
        <Icon size={20} color={'#fff'} strokeWidth={1.8} />
        <Text style={[acc.title, { color: colors.textPrimary }]}>{section.title}</Text>
        {open
          ? <ChevronUp size={18} color={colors.textTertiary} />
          : <ChevronDown size={18} color={colors.textTertiary} />
        }
      </TouchableOpacity>
      {open && (
        <View style={acc.body}>
          <Text style={[acc.bodyText, { color: colors.textSecondary }]}>{section.content}</Text>
          {section.bullets?.map((b) => (
            <View key={b} style={acc.bulletRow}>
              <View style={[acc.dot, { backgroundColor: colors.primary }]} />
              <Text style={[acc.bulletText, { color: colors.textSecondary }]}>{b}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const PrivacyPolicy = () => {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: '#121212' }]} edges={["top"]}>
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={'#121212'} />

     <GeneralHeader title="Privacy Policy" onBack={() => router.back()} leftIcon={<ArrowLeft color={'#fff'} />} />

      <ScrollView
        style={{ backgroundColor: '#121212' }}
        contentContainerStyle={[s.body, { backgroundColor: '#121212' }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Icon */}
        {/* <View style={[s.iconBubble, { backgroundColor: colors.primary + 10 }]}>
          <ShieldCheck size={28} color={colors.primary} strokeWidth={1.8} />
        </View> */}

        <Text style={[s.pageTitle, { color: colors.textPrimary }]}>Your Privacy Matters</Text>
        <Text style={[s.pageIntro, { color: colors.textSecondary }]}>
          At Bondies, we believe meaningful connections are built on trust. We are committed to protecting your personal data and being transparent about how we use it.
        </Text>
        <Text style={[s.lastUpdated, { color: colors.primary }]}>LAST UPDATED: FEBRUARY 24, 2026</Text>

        {/* Accordion */}
        <View style={[s.accordionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {SECTIONS.map((sec, i) => (
            <AccordionSection
              key={sec.id}
              section={sec}
              colors={colors}
              defaultOpen={i === 0}
            />
          ))}
        </View>

        {/* Contact card */}
        <View style={[s.contactCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[s.contactTitle, { color: colors.textPrimary }]}>Have questions?</Text>
          <Text style={[s.contactBody, { color: colors.textSecondary }]}>
            If you have any questions about this Privacy Policy or our data practices, please reach out to our privacy officer.
          </Text>
          <TouchableOpacity
            style={s.contactLink}
            onPress={() => Linking.openURL("mailto:privacy@bondies.app")}
          >
            <Text style={s.contactLinkText}>Contact Privacy Team</Text>
            <ExternalLink size={14} color={colors.primary} strokeWidth={2} />
          </TouchableOpacity>
        </View>
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
  iconBubble: {
    width: 60, height: 60, borderRadius: 16,
    alignItems: "center", justifyContent: "center", marginBottom: 20,
  },
  pageTitle: { fontSize: 26, fontFamily: "OutfitBold", letterSpacing: -0.5, marginBottom: 12 },
  pageIntro: { fontSize: 14, fontFamily: "Outfit", lineHeight: 21, marginBottom: 10 },
  lastUpdated: { fontSize: 11, fontFamily: "OutfitBold", letterSpacing: 0.6, marginBottom: 24 },
  accordionCard: {
    borderRadius: 16, borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden", marginBottom: 20,
  },
  contactCard: {
    borderRadius: 16, borderWidth: StyleSheet.hairlineWidth,
    padding: 18,
  },
  contactTitle: { fontSize: 16, fontFamily: "OutfitBold", marginBottom: 8 },
  contactBody: { fontSize: 13, fontFamily: "Outfit", lineHeight: 19, marginBottom: 14 },
  contactLink: { flexDirection: "row", alignItems: "center", gap: 6 },
  contactLinkText: { fontSize: 14, fontFamily: "OutfitBold", color: colors.primary },
});

const acc = StyleSheet.create({
  wrapper: { borderBottomWidth: StyleSheet.hairlineWidth },
  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingVertical: 16,
  },
  title: { flex: 1, fontSize: 16, fontFamily: "OutfitSemiBold" },
  body: { paddingHorizontal: 16, paddingBottom: 16 },
  bodyText: { fontSize: 14, fontFamily: "OutfitMedium", lineHeight: 19, marginBottom: 10 },
  bulletRow: { flexDirection: "row", gap: 8, alignItems: "flex-start", marginBottom: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 6, flexShrink: 0 },
  bulletText: { flex: 1, fontSize: 13, fontFamily: "Outfit", lineHeight: 19 },
});

export default PrivacyPolicy;