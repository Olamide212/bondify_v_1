/**
 * CommunityGuidelines.js
 * Route: /community-guidelines
 */

import React from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, ImageBackground, Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Heart, Shield, Lock, Scale, Camera, AlertTriangle } from "lucide-react-native";
import { useTheme } from "../../../context/ThemeContext";

const GUIDELINES = [
  {
    Icon: Heart,
    title: "Be Respectful",
    body: "Treat others with kindness and empathy. We have zero tolerance for harassment or hate speech.",
  },
  {
    Icon: Shield,
    title: "No Fake Profiles",
    body: "Authenticity is key. Be yourself, use your own photos, and don't impersonate others.",
  },
  {
    Icon: Lock,
    title: "Stay Safe",
    body: "Protect your private info. Meet in public places and let friends know where you're going.",
  },
  {
    Icon: Scale,
    title: "Follow the Law",
    body: "Don't use Bondies for illegal activities or to share illegal content of any kind.",
  },
  {
    Icon: Camera,
    title: "Appropriate Photos",
    body: "Keep your photos appropriate. No nudity, explicit content, or graphic imagery allowed.",
  },
  {
    Icon: AlertTriangle,
    title: "Report Bad Behavior",
    body: "If someone violates these guidelines, please report them so we can keep the community safe.",
  },
];

const CommunityGuidelines = () => {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.surface }]} edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header — overlaid on the hero image */}
      <View style={s.headerOverlay}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <ArrowLeft size={22} color="#fff" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Community Guidelines</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{ backgroundColor: colors.background, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
      >
        {/* Hero image with gradient overlay */}
        <View style={s.hero}>
          <View style={s.heroGradient} />
          <Text style={s.heroText}>Welcome to Bondies</Text>
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
          {/* Intro */}
          <Text style={[s.intro, { color: colors.textSecondary }]}>
            We&apos;re built on meaningful connections. To keep our community safe and fun for everyone, please follow these simple rules.
          </Text>

          {/* Guideline cards */}
          {GUIDELINES.map(({ Icon, title, body }) => (
            <View key={title} style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[s.iconBubble, { backgroundColor: "#FEF3EC" }]}>
                <Icon size={20} color="#E8651A" strokeWidth={1.8} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.cardTitle, { color: colors.textPrimary }]}>{title}</Text>
                <Text style={[s.cardBody, { color: colors.textSecondary }]}>{body}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View style={[s.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity style={s.agreeBtn} activeOpacity={0.88} onPress={() => router.back()}>
          <Text style={s.agreeBtnText}>I Understand & Agree</Text>
        </TouchableOpacity>
        <Text style={[s.footerNote, { color: colors.textTertiary }]}>
          By tapping agree you confirm you&apos;ve read our{" "}
          <Text style={{ color: "#E8651A" }} onPress={() => router.push("/terms-of-service")}>
            Terms of Service
          </Text>
          {" "}and{" "}
          <Text style={{ color: "#E8651A" }} onPress={() => router.push("/privacy-policy")}>
            Privacy Policy
          </Text>
          .
        </Text>
      </View>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1 },
  headerOverlay: {
    position: "absolute", top: 48, left: 0, right: 0, zIndex: 10,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14,
  },
  headerTitle: { fontSize: 18, fontFamily: "PlusJakartaSansBold", color: "#fff" },
  hero: {
    height: 220,
    backgroundColor: "#4A4A4A",
    justifyContent: "flex-end",
    padding: 20,
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  heroText: {
    fontSize: 28, fontFamily: "PlusJakartaSansBold",
    color: "#fff", letterSpacing: -0.5,
  },
  intro: {
    fontSize: 14, fontFamily: "PlusJakartaSans",
    lineHeight: 22, textAlign: "center", marginBottom: 28,
  },
  card: {
    flexDirection: "row", gap: 14, borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth, padding: 16, marginBottom: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  iconBubble: {
    width: 42, height: 42, borderRadius: 12,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  cardTitle: { fontSize: 16, fontFamily: "PlusJakartaSansBold", marginBottom: 4 },
  cardBody: { fontSize: 13, fontFamily: "PlusJakartaSans", lineHeight: 19 },
  footer: {
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 28,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  agreeBtn: {
    backgroundColor: "#E8651A", borderRadius: 50,
    paddingVertical: 16, alignItems: "center", marginBottom: 12,
  },
  agreeBtnText: { fontSize: 16, fontFamily: "PlusJakartaSansBold", color: "#fff" },
  footerNote: { fontSize: 12, fontFamily: "PlusJakartaSans", textAlign: "center", lineHeight: 18 },
});

export default CommunityGuidelines;