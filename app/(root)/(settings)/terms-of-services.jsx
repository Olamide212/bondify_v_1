/**
 * TermsOfService.js
 * Route: /terms-of-service
 */

import React from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Calendar } from "lucide-react-native";
import { useTheme } from "../../../context/ThemeContext";
import GeneralHeader from "../../../components/headers/GeneralHeader";
import {colors} from "../../../constant/colors"

const TERMS = [
  {
    number: 1,
    title: "Acceptance of Terms",
    body: "By accessing or using the Bondies dating application, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, please do not use the app. We reserve the right to modify these terms at any time.",
  },
  {
    number: 2,
    title: "Eligibility",
    body: "You must be at least 18 years of age to create an account on Bondies and use the Service. By creating an account and using the Service, you represent and warrant that you can form a binding contract with Bondies.",
  },
  {
    number: 3,
    title: "Account Security",
    body: "You are responsible for maintaining the confidentiality of your login credentials you use to sign up for Bondies, and you are solely responsible for all activities that occur under those credentials.",
  },
  {
    number: 4,
    title: "Prohibited Conduct",
    bullets: [
      "Use the Service for any purpose that is illegal or prohibited by these Terms.",
      "Use the Service for any harmful or nefarious purpose.",
      "Spam, solicit money from or defraud any members.",
      "Impersonate any person or entity or post any images of another person without his or her permission.",
    ],
  },
  {
    number: 5,
    title: "Termination",
    body: "Bondies reserves the right to investigate and, if necessary, terminate your account without a refund if you have violated these Terms, misused the Service or behaved in a way that Bondies regards as inappropriate or unlawful.",
  },
];

const TermsOfService = () => {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.surface }]} edges={["top", "bottom"]}>
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.surface} />

     <GeneralHeader title="Legal" onBack={() => router.back()} leftIcon={<ArrowLeft />} />

      <ScrollView
        style={{ backgroundColor: "#fff" }}
        contentContainerStyle={[s.body, { backgroundColor: '#fff' }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[s.pageTitle, { color: colors.textPrimary }]}>Bondies Terms of{"\n"}Service</Text>

        {/* Date badge */}
        <View style={s.dateBadge}>
          <Calendar size={12} color={colors.primary} strokeWidth={2} />
          <Text style={[s.dateText, { color: colors.primary }]}>Last Updated: FEBRUARY 24, 2026</Text>
        </View>

        <Text style={[s.intro, { color: colors.textSecondary }]}>
          Welcome to Bondies. These Terms of Service (&quot;Terms&ldquo;) govern your access to and use of our mobile application and services. By creating an account, you agree to these Terms in their entirety.
        </Text>

        {/* Numbered sections */}
        {TERMS.map(({ number, title, body, bullets }) => (
          <View key={number} style={s.section}>
            <View style={s.sectionHeader}>
              <View style={s.numberBadge}>
                <Text style={s.numberText}>{number}</Text>
              </View>
              <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>{title}</Text>
            </View>
            {body && (
              <Text style={[s.sectionBody, { color: colors.textSecondary }]}>{body}</Text>
            )}
            {bullets?.map((b) => (
              <View key={b} style={s.bulletRow}>
                <View style={[s.dot, { backgroundColor: colors.primary }]} />
                <Text style={[s.bulletText, { color: colors.textSecondary }]}>{b}</Text>
              </View>
            ))}
          </View>
        ))}

        {/* Contact */}
        <Text style={[s.contactNote, { color: colors.textTertiary }]}>
          Have questions about our terms? Reach out to our legal team.
        </Text>
        <TouchableOpacity
          style={s.contactBtn}
          onPress={() => Linking.openURL("mailto:legal@bondies.app")}
          activeOpacity={0.88}
        >
          <Text style={s.contactBtnText}>Contact Support</Text>
        </TouchableOpacity>

       
      </ScrollView>

      {/* Bottom bar */}
      {/* <View style={[s.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TouchableOpacity style={[s.declineBtn, { borderColor: colors.border }]} onPress={() => router.back()}>
          <Text style={[s.declineBtnText, { color: colors.textSecondary }]}>Decline</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.agreeBtn} onPress={() => router.back()} activeOpacity={0.88}>
          <Text style={s.agreeBtnText}>I Agree</Text>
        </TouchableOpacity>
      </View> */}
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 18, fontFamily: "PlusJakartaSansBold" },
  body: { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 40 },
  pageTitle: { fontSize: 28, fontFamily: "PlusJakartaSansBold", letterSpacing: -0.5, marginBottom: 12 },
  dateBadge: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 },
  dateText: { fontSize: 12, fontFamily: "PlusJakartaSansBold", letterSpacing: 0.2 },
  intro: { fontSize: 14, fontFamily: "PlusJakartaSans", lineHeight: 21, marginBottom: 28 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  numberBadge: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primary + 10, alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  numberText: { fontSize: 16, fontFamily: "PlusJakartaSansBold", color: colors.primary },
  sectionTitle: { fontSize: 17, fontFamily: "PlusJakartaSansBold" },
  sectionBody: { fontSize: 14, fontFamily: "PlusJakartaSans", lineHeight: 21 },
  bulletRow: { flexDirection: "row", gap: 8, alignItems: "flex-start", marginBottom: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 7, flexShrink: 0 },
  bulletText: { flex: 1, fontSize: 14, fontFamily: "PlusJakartaSans", lineHeight: 21 },
  contactNote: { fontSize: 13, fontFamily: "PlusJakartaSans", textAlign: "center", marginBottom: 14 },
  contactBtn: {
    backgroundColor: colors.primary, borderRadius: 50,
    paddingVertical: 15, alignItems: "center", marginBottom: 24,
  },
  contactBtnText: { fontSize: 15, fontFamily: "PlusJakartaSansBold", color: "#fff" },
  brandFooter: {
    backgroundColor: "#4A4A4A", borderRadius: 16,
    paddingVertical: 28, alignItems: "center", gap: 6,
  },
  brandName: { fontSize: 22, fontFamily: "PlusJakartaSansBold", color: "#fff" },
  brandTag: { fontSize: 10, fontFamily: "PlusJakartaSans", color: "rgba(255,255,255,0.6)", letterSpacing: 1.5 },
  bottomBar: {
    flexDirection: "row", gap: 12, paddingHorizontal: 20, paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  declineBtn: {
    flex: 1, borderRadius: 50, borderWidth: 1.5,
    paddingVertical: 14, alignItems: "center",
  },
  declineBtnText: { fontSize: 15, fontFamily: "PlusJakartaSansBold" },
  agreeBtn: {
    flex: 1, backgroundColor: "#E8651A", borderRadius: 50,
    paddingVertical: 14, alignItems: "center",
  },
  agreeBtnText: { fontSize: 15, fontFamily: "PlusJakartaSansBold", color: "#fff" },
});

export default TermsOfService;