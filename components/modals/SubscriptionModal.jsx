import { ArrowLeft, BadgeCheck, CheckCircle2, Sparkles, X, Zap } from "lucide-react-native";
import { useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../constant/colors";
import { Icons } from "../../constant/icons";
import BaseModal from "./BaseModal";

// ─── Feature cards data ────────────────────────────────────────────────────────
const features = [
  {
    id: "icebreakers",
    title: "Unlimited AI Icebreakers",
    description:
      "Let our AI craft the perfect first message based on their unique personality.",
    iconBg: colors.primary,
    Icon: Zap,
    iconColor: "#fff",
    fullWidth: true,
  },
  {
    id: "profile",
    title: "Profile Analysis & Tips",
    description:
      "Actionable insights to make your profile stand out from the crowd.",
    iconBg: "#E8D5FF",
    Icon: Sparkles,
    iconColor: "#7C3AED",
    fullWidth: true,
  },
  {
    id: "discovery",
    title: "Priority Discovery",
    description:
      "Be seen 3× more often by high-compatibility matches in your area.",
    iconBg: colors.primary + "33",
    Icon: BadgeCheck,
    iconColor: colors.primary,
    fullWidth: true,
  },
  {
    id: "superbonds",
    title: "5 Super Bonds",
    description: "Per day to show serious intent.",
    iconBg: colors.secondary + "33",
    Icon: Zap,
    iconColor: colors.secondary,
    fullWidth: false,
  },
  {
    id: "adfree",
    title: "Ad-free",
    description: "A seamless, focused experience.",
    iconBg: "#F3F4F6",
    Icon: X,
    iconColor: "#9CA3AF",
    fullWidth: false,
  },
];

// ─── Pricing ───────────────────────────────────────────────────────────────────
const pricing = {
  monthly: {
    amount: "₦5,000",
    period: "/mo",
    sub: null,
    perks: ["Cancel anytime", "Full access immediately"],
    badge: null,
  },
  yearly: {
    amount: "₦3,500",
    period: "/mo",
    sub: "Billed annually (₦42,000/year)",
    perks: ["Save 30% compared to monthly", "7-day free trial included"],
    badge: "BEST VALUE",
  },
};

// ─── Feature card ──────────────────────────────────────────────────────────────
const FeatureCard = ({ feature }) => {
  const { title, description, iconBg, Icon, iconColor, fullWidth } = feature;

  return (
    <View style={[styles.featureCard, !fullWidth && styles.featureCardHalf]}>
      <View style={[styles.featureIconWrap, { backgroundColor: iconBg }]}>
        <Icon size={22} color={iconColor} strokeWidth={2.2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDesc}>{description}</Text>
      </View>
    </View>
  );
};

// ─── Main Modal ────────────────────────────────────────────────────────────────
const SubscriptionModal = ({ visible, onClose }) => {
  const [billingCycle, setBillingCycle] = useState("yearly");

  const plan = pricing[billingCycle];

  // Split features into full-width and half-width
  const fullFeatures = features.filter((f) => f.fullWidth);
  const halfFeatures = features.filter((f) => !f.fullWidth);

  return (
    <BaseModal visible={visible} onClose={onClose} fullScreen>
      <SafeAreaProvider>
        <SafeAreaView style={styles.container}>

          {/* ── Header ── */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.backBtn} hitSlop={8}>
              <ArrowLeft size={22} color="#111" strokeWidth={2} />
            </TouchableOpacity>
          
            <View style={{ width: 38 }} />
          </View>

          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            {/* ── Premium badge ── */}
            <View style={styles.premiumBadge}>
              <Sparkles size={13} color="#7C3AED" strokeWidth={2} />
              <Text style={styles.premiumBadgeText}>PREMIUM EXPERIENCE</Text>
            </View>

            {/* ── Hero text ── */}
            <Text style={styles.heroTitle}>
              Bondies{" "}
              <Text style={styles.heroTitleAccent}>AI Plus</Text>
            </Text>
            <Text style={styles.heroSub}>
              Elevate your social flow with{"\n"}intelligent connection tools.
            </Text>

            {/* ── Full-width feature cards ── */}
            <View style={styles.featuresContainer}>
              {fullFeatures.map((f) => (
                <FeatureCard key={f.id} feature={f} />
              ))}

              {/* ── Half-width cards row ── */}
              <View style={styles.halfRow}>
                {halfFeatures.map((f) => (
                  <FeatureCard key={f.id} feature={f} />
                ))}
              </View>
            </View>

            {/* ── Billing toggle ── */}
            <View style={styles.toggleWrap}>
              {["monthly", "yearly"].map((cycle) => (
                <TouchableOpacity
                  key={cycle}
                  style={[
                    styles.toggleBtn,
                    billingCycle === cycle && styles.toggleBtnActive,
                  ]}
                  onPress={() => setBillingCycle(cycle)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.toggleBtnText,
                      billingCycle === cycle && styles.toggleBtnTextActive,
                    ]}
                  >
                    {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ── Pricing card ── */}
            <View style={styles.pricingCard}>
              {/* Best Value ribbon */}
              {plan.badge && (
                <View style={styles.ribbon}>
                  <Text style={styles.ribbonText}>{plan.badge}</Text>
                </View>
              )}

              <View style={styles.priceRow}>
                <Text style={styles.priceAmount}>{plan.amount}</Text>
                <Text style={styles.pricePeriod}>{plan.period}</Text>
              </View>

              {plan.sub && (
                <Text style={styles.priceSub}>{plan.sub}</Text>
              )}

              <View style={styles.perksList}>
                {plan.perks.map((perk, i) => (
                  <View key={i} style={styles.perkRow}>
                    <CheckCircle2
                      size={18}
                      color={colors.primary}
                      strokeWidth={2}
                    />
                    <Text style={styles.perkText}>{perk}</Text>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* ── Sticky CTA ── */}
          <View style={styles.ctaWrap}>
            <TouchableOpacity style={styles.ctaBtn} activeOpacity={0.88}>
              <Text style={styles.ctaBtnText}>Upgrade to AI Plus</Text>
            </TouchableOpacity>
            <Text style={styles.legalText}>
              Subscription will automatically renew at the end of the period.
              Manage your subscription in your Account Settings. By continuing,
              you agree to our{" "}
              <Text style={styles.legalLink}>Terms of Service</Text> and{" "}
              <Text style={styles.legalLink}>Privacy Policy</Text>.
            </Text>
          </View>

        </SafeAreaView>
      </SafeAreaProvider>
    </BaseModal>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#121212",
  },
  backBtn: {
    width: 38,
    height: 38,
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "PlusJakartaSansBold",
    fontSize: 18,
    color: colors.primary,
  },

  // Scroll
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    alignItems: "center",
  },

  // Premium badge
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EDE9FE",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 50,
    marginTop: 8,
    marginBottom: 20,
  },
  premiumBadgeText: {
    fontFamily: "PlusJakartaSansBold",
    fontSize: 11,
    color: "#7C3AED",
    letterSpacing: 1,
  },

  // Hero
  heroTitle: {
    fontFamily: "PlusJakartaSansBold",
    fontSize: 34,
    color: '#E5E5E5',
    textAlign: "center",
    marginBottom: 10,
  },
  heroTitleAccent: {
    color: colors.primary,
    fontStyle: "italic",
  },
  heroSub: {
    fontFamily: "PlusJakartaSansMedium",
    fontSize: 15,
    color: '#9CA3AF',
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },

  // Feature cards
  featuresContainer: {
    width: "100%",
    gap: 14,
    marginBottom: 28,
  },
  featureCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#121212",
    borderRadius: 18,
    padding: 18,
    gap: 14,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
  },
  featureCardHalf: {
    flex: 1,
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 10,
  },
  halfRow: {
    flexDirection: "row",
    gap: 14,
  },
  featureIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  featureTitle: {
    fontFamily: "PlusJakartaSansBold",
    fontSize: 15,
    color: '#E5E5E5',
    marginBottom: 4,
  },
  featureDesc: {
    fontFamily: "PlusJakartaSans",
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 19,
  },

  // Billing toggle
  toggleWrap: {
    flexDirection: "row",
    backgroundColor: '#1E1E1E',
    borderRadius: 50,
    padding: 4,
    width: "100%",
    marginBottom: 16,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 50,
    alignItems: "center",
  },
  toggleBtnActive: {
    backgroundColor: "#121212",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 2,
  },
  toggleBtnText: {
    fontFamily: "PlusJakartaSansMedium",
    fontSize: 15,
    color: "#9CA3AF",
  },
  toggleBtnTextActive: {
    fontFamily: "PlusJakartaSansBold",
    color: colors.primary,
  },

  // Pricing card
  pricingCard: {
    width: "100%",
    backgroundColor: "#121212",
    borderRadius: 20,
    padding: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 3,
  },
  ribbon: {
    position: "absolute",
    top: 16,
    right: -30,
    backgroundColor: colors.primary,
    paddingHorizontal: 36,
    paddingVertical: 6,
    transform: [{ rotate: "38deg" }],
    width: 140,
    alignItems: "center",
  },
  ribbonText: {
    fontFamily: "PlusJakartaSansBold",
    fontSize: 10,
    color: "#fff",
    letterSpacing: 0.8,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
    marginBottom: 4,
  },
  priceAmount: {
    fontFamily: "PlusJakartaSansBold",
    fontSize: 40,
    color: '#E5E5E5',
    lineHeight: 46,
  },
  pricePeriod: {
    fontFamily: "PlusJakartaSansMedium",
    fontSize: 18,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  priceSub: {
    fontFamily: "PlusJakartaSansMedium",
    fontSize: 13,
    color: colors.primary,
    marginBottom: 16,
  },
  perksList: {
    gap: 10,
  },
  perkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  perkText: {
    fontFamily: "PlusJakartaSans",
    fontSize: 14,
    color: '#D1D5DB',
  },

  // CTA
  ctaWrap: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: "#121212",
    borderTopWidth: 1,
    borderTopColor: '#333333',
    gap: 12,
  },
  ctaBtn: {
    backgroundColor: colors.primary,
    borderRadius: 50,
    paddingVertical: 18,
    alignItems: "center",
  },
  ctaBtnText: {
    fontFamily: "PlusJakartaSansBold",
    fontSize: 17,
    color: "#fff",
  },
  legalText: {
    fontFamily: "PlusJakartaSans",
    fontSize: 11,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 16,
  },
  legalLink: {
    color: colors.primary,
    fontFamily: "PlusJakartaSansMedium",
  },
});

export default SubscriptionModal;