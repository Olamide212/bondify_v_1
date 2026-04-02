/**
 * CookiePolicy.js
 * Route: /cookie-policy
 */

import React, { useState } from "react";
import {
  View, Text, Switch, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Cookie, ShieldCheck, BarChart2, Megaphone } from "lucide-react-native";
import { useTheme } from "../../../context/ThemeContext";
import GeneralHeader from "../../../components/headers/GeneralHeader";

const CookiePolicy = () => {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(false);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: '#fff' }]} edges={["top"]}>
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.surface} />

      {/* Header */}
     <GeneralHeader title="Cookie Policy" onBack={() => router.back()} leftIcon={<ArrowLeft />} />

      <ScrollView
        style={{ backgroundColor: '#fff' }}
        contentContainerStyle={[s.body, { backgroundColor: '#fff' }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Icon */}
        {/* <View style={[s.iconBubble, { backgroundColor: colors.primary + 10 }]}>
          <Cookie size={28} color={colors.primary} strokeWidth={1.8} />
        </View> */}

        <Text style={[s.pageTitle, { color: colors.textPrimary }]}>How we use cookies</Text>
        <Text style={[s.pageIntro, { color: colors.textSecondary }]}>
          At Bondies, we use cookies and similar technologies to help us understand how you use our app and to improve your dating experience.
        </Text>

        {/* Section */}
        <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>What are cookies?</Text>
        <Text style={[s.bodyText, { color: colors.textSecondary }]}>
          Cookies are small text files that are stored on your device when you visit websites or use apps. They allow us to remember your preferences and understand how you interact with Bondies so we can suggest better matches.
        </Text>

        {/* Cookie types */}
        <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>Cookie Types</Text>

        {/* Essential — always on */}
        <View style={[s.cookieCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={s.cookieRow}>
            <View style={[s.cookieIcon, { backgroundColor: colors.primary + 10 }]}>
              <ShieldCheck size={20} color={colors.primary} strokeWidth={1.8} />
            </View>
            <Text style={[s.cookieTitle, { color: colors.textPrimary }]}>Essential Cookies</Text>
          </View>
          <Text style={[s.cookieDesc, { color: colors.textSecondary }]}>
            Required for the app to function. They handle secure logins, session management, and keep your account safe. These cannot be turned off.
          </Text>
        </View>

        {/* Analytics */}
        <View style={[s.cookieCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={s.cookieRowBetween}>
            <View style={s.cookieRow}>
              <View style={[s.cookieIcon, { backgroundColor: colors.primary + 10 }]}>
                <BarChart2 size={20} color={colors.primary} strokeWidth={1.8} />
              </View>
              <Text style={[s.cookieTitle, { color: colors.textPrimary }]}>Analytics</Text>
            </View>
            <Switch
              value={analytics}
              onValueChange={setAnalytics}
              trackColor={{ false: colors.switchTrackOff, true: colors.primary }}
              thumbColor={Platform.OS === "android" ? "#fff" : undefined}
              ios_backgroundColor={colors.switchTrackOff}
            />
          </View>
          <Text style={[s.cookieDesc, { color: colors.textSecondary }]}>
            Help us understand which features are most popular and how users navigate the app so we can improve the experience.
          </Text>
        </View>

        {/* Marketing */}
        <View style={[s.cookieCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={s.cookieRowBetween}>
            <View style={s.cookieRow}>
              <View style={[s.cookieIcon, { backgroundColor: colors.primary + 10 }]}>
                <Megaphone size={20} color={colors.primary} strokeWidth={1.8} />
              </View>
              <Text style={[s.cookieTitle, { color: colors.textPrimary }]}>Marketing</Text>
            </View>
            <Switch
              value={marketing}
              onValueChange={setMarketing}
              trackColor={{ false: colors.switchTrackOff, true: colors.primary }}
              thumbColor={Platform.OS === "android" ? "#fff" : undefined}
              ios_backgroundColor={colors.switchTrackOff}
            />
          </View>
          <Text style={[s.cookieDesc, { color: colors.textSecondary }]}>
            Used to deliver more relevant advertisements and track our marketing performance across different platforms.
          </Text>
        </View>

        {/* Updates */}
        <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>Updates to this policy</Text>
        <Text style={[s.bodyText, { color: colors.textSecondary }]}>
          We may update this policy from time to time to reflect changes in our practices. We will notify you of any significant changes via the app.
        </Text>
        <Text style={[s.lastUpdated, { color: colors.textTertiary }]}>
          LAST UPDATED: FEBRUARY 24, 2026
        </Text>
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
  headerTitle: { fontSize: 18, fontFamily: "PlusJakartaSansBold" },
  body: { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 60 },
  iconBubble: {
    width: 60, height: 60, borderRadius: 16,
    alignItems: "center", justifyContent: "center", marginBottom: 20,
  },
  pageTitle: { fontSize: 26, fontFamily: "PlusJakartaSansBold", letterSpacing: -0.5, marginBottom: 12 },
  pageIntro: { fontSize: 14, fontFamily: "PlusJakartaSans", lineHeight: 21, marginBottom: 28 },
  sectionTitle: { fontSize: 18, fontFamily: "PlusJakartaSansBold", marginBottom: 10, marginTop: 4 },
  bodyText: { fontSize: 14, fontFamily: "PlusJakartaSans", lineHeight: 21, marginBottom: 24 },
  cookieCard: {
    borderRadius: 14, borderWidth: StyleSheet.hairlineWidth,
    padding: 14, marginBottom: 10,
  },
  cookieRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  cookieRowBetween: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 8,
  },
  cookieIcon: {
    width: 34, height: 34, borderRadius: 9,
    alignItems: "center", justifyContent: "center",
  },
  cookieTitle: { fontSize: 15, fontFamily: "PlusJakartaSansBold" },
  cookieDesc: { fontSize: 13, fontFamily: "PlusJakartaSans", lineHeight: 19 },
  lastUpdated: { fontSize: 11, fontFamily: "PlusJakartaSansBold", letterSpacing: 0.6, marginTop: 8 },
});

export default CookiePolicy;