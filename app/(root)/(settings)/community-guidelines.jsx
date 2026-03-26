/**
 * CommunityGuidelines.js
 * Route: /community-guidelines
 */

import { useRouter } from "expo-router";
import { AlertTriangle, ArrowLeft, Camera, Heart, Lock, Scale, Shield } from "lucide-react-native";
import {
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import GeneralHeader from "../../../components/headers/GeneralHeader";
import { images } from "../../../constant/images";
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
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <GeneralHeader title="Community Guidelines" leftIcon={<ArrowLeft />} />

      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image */}
        <View style={s.heroContainer}>
          <Image
            source={images.onboardingImage}
            style={s.heroImage}
            resizeMode="cover"
          />
        </View>

        {/* Title */}
        <Text style={[s.title, { color: colors.textPrimary }]}>Welcome to Bondies</Text>

        <View style={{ paddingHorizontal: 20 }}>
          {/* Intro */}
          <Text style={[s.intro, { color: colors.textSecondary }]}>
            We&apos;re built on meaningful connections. To keep our community safe and fun for everyone, please follow these simple rules.
          </Text>

          {/* Guideline cards */}
          {GUIDELINES.map(({ Icon, title, body }) => (
            <View key={title} style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[s.iconBubble, { backgroundColor: colors.primary +10 }]}>
                <Icon size={20} color={colors.primary} strokeWidth={1.8} />
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
        {/* <TouchableOpacity style={s.agreeBtn} activeOpacity={0.88} onPress={() => router.back()}>
          <Text style={s.agreeBtnText}>I Understand & Agree</Text>
        </TouchableOpacity> */}
        <Text style={[s.footerNote, { color: colors.textTertiary }]}>
          By tapping agree you confirm you&apos;ve read our{" "}
          <Text style={{ color: colors.primary }} onPress={() => router.push("/terms-of-services")}>
            Terms of Service
          </Text>
          {" "}and{" "}
          <Text style={{ color:  colors.primary }} onPress={() => router.push("/privacy-policy")}>
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
  heroContainer: { 
    marginHorizontal: 16, 
    borderRadius: 20, 
    overflow: "hidden", 
    height: 220, 
    marginTop: 16,
    marginBottom: 24 
  },
  heroImage: { 
    width: "100%", 
    height: "100%" 
  },
  title: {
    fontSize: 22, 
    fontFamily: "PlusJakartaSansBold", 
    textAlign: "center", 
    marginBottom: 8, 
    paddingHorizontal: 24,
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