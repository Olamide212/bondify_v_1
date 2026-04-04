import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { BadgeCheck, ChevronRight, Clock, ShieldCheck } from "lucide-react-native";
import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";
import { colors } from "../../constant/colors";

// ── Animated blob for verified state ────────────────────────────────────────
const Blob = ({ color, size, style, delay = 0 }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 3200,
          delay,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 3200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.25] });
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });
  const opacity = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.45, 0.7, 0.45] });

  return (
    <Animated.View
      style={[
        { position: "absolute", width: size, height: size },
        style,
        { transform: [{ scale }, { translateY }], opacity },
      ]}
      pointerEvents="none"
    >
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id="g" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={color} stopOpacity="0.7" />
            <Stop offset="100%" stopColor={color} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill="url(#g)" />
      </Svg>
    </Animated.View>
  );
};

// ── Verified card content ───────────────────────────────────────────────────
const VerifiedContent = () => (
  <View style={s.verifiedInner}>
    {/* Decorative blobs */}
    <Blob color="#10B981" size={90} style={{ top: -20, left: -15 }} delay={0} />
    <Blob color={colors.primary} size={70} style={{ bottom: -12, right: -10 }} delay={800} />
    <Blob color="#34D399" size={50} style={{ top: 10, right: 30 }} delay={1600} />

    <View style={s.verifiedBadgeRow}>
      <LinearGradient
        colors={["#10B981", "#059669"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.verifiedIconCircle}
      >
        <BadgeCheck size={24} color="#fff" strokeWidth={2.2} />
      </LinearGradient>
      <View style={s.verifiedTextBlock}>
        <Text style={s.verifiedTitle}>Identity Verified</Text>
        <Text style={s.verifiedLabel}>Trusted member</Text>
      </View>
    </View>

    <Text style={s.verifiedDesc}>
      Your profile carries the verified badge — others can trust it's really you.
    </Text>

    <View style={s.verifiedPerks}>
      {["Higher visibility in Discover", "Trust badge on your profile", "Priority in matching"].map(
        (perk, i) => (
          <View key={i} style={s.perkRow}>
            <View style={s.perkDot} />
            <Text style={s.perkText}>{perk}</Text>
          </View>
        )
      )}
    </View>
  </View>
);

// ── Pending card content ────────────────────────────────────────────────────
const PendingContent = () => (
  <View style={s.stateRow}>
    <View style={s.pendingIconCircle}>
      <Clock size={20} color="#F59E0B" strokeWidth={2} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={s.cardTitle}>Verification Pending</Text>
      <Text style={s.cardSub}>
        We're reviewing your selfie. This usually takes a few minutes.
      </Text>
    </View>
  </View>
);

// ── Unverified card content ─────────────────────────────────────────────────
const UnverifiedContent = () => (
  <View style={s.stateRow}>
    <LinearGradient
      colors={[colors.primary, "#C7018A"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={s.unverifiedIconCircle}
    >
      <ShieldCheck size={20} color="#fff" strokeWidth={2} />
    </LinearGradient>
    <View style={{ flex: 1 }}>
      <Text style={s.cardTitle}>Get Verified</Text>
      <Text style={s.cardSub}>
        Take a quick selfie to verify your identity and earn a trust badge.
      </Text>
      <View style={s.ctaRow}>
        <Text style={s.ctaText}>Verify now</Text>
        <ChevronRight size={15} color={colors.primary} strokeWidth={2.5} />
      </View>
    </View>
  </View>
);

// ── Main component ──────────────────────────────────────────────────────────
const Verification = ({ profile }) => {
  const router   = useRouter();
  const verified = profile?.verificationStatus === "approved";
  const pending  = profile?.verificationStatus === "pending";

  const handlePress = () => {
    if (verified || pending) return;
    router.push("/verification");
  };

  return (
    <TouchableOpacity
      style={[
        s.card,
        verified && s.cardVerified,
        pending && s.cardPending,
      ]}
      onPress={handlePress}
      activeOpacity={verified || pending ? 1 : 0.85}
    >
      {verified ? <VerifiedContent /> : pending ? <PendingContent /> : <UnverifiedContent />}
    </TouchableOpacity>
  );
};

export default Verification;

// ─── Styles ─────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  // ── Card shell ────────────────────────────────────────────────────────────
  card: {
    marginHorizontal: 16,
    borderRadius:     16,
    borderWidth:      1,
    borderColor:      "rgba(255,255,255,0.08)",
    backgroundColor:  "rgba(255,255,255,0.03)",
    padding:          18,
    overflow:         "hidden",
  },
  cardVerified: {
    borderColor:     "rgba(16,185,129,0.25)",
    backgroundColor: "rgba(16,185,129,0.06)",
  },
  cardPending: {
    borderColor:     "rgba(245,158,11,0.2)",
    backgroundColor: "rgba(245,158,11,0.04)",
  },

  // ── Shared row layout (pending + unverified) ─────────────────────────────
  stateRow: {
    flexDirection: "row",
    alignItems:    "flex-start",
    gap:           14,
  },
  cardTitle: {
    fontSize:     16,
    fontFamily:   "OutfitBold",
    color:        "#E5E5E5",
    marginBottom: 4,
  },
  cardSub: {
    fontSize:   13,
    fontFamily: "Outfit",
    color:      "#9CA3AF",
    lineHeight: 19,
  },

  // ── Unverified ────────────────────────────────────────────────────────────
  unverifiedIconCircle: {
    width:           44,
    height:          44,
    borderRadius:    22,
    alignItems:      "center",
    justifyContent:  "center",
    flexShrink:      0,
  },
  ctaRow: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           4,
    marginTop:     8,
  },
  ctaText: {
    fontSize:   13,
    fontFamily: "OutfitSemiBold",
    color:      colors.primary,
  },

  // ── Pending ───────────────────────────────────────────────────────────────
  pendingIconCircle: {
    width:           44,
    height:          44,
    borderRadius:    22,
    backgroundColor: "rgba(245,158,11,0.12)",
    alignItems:      "center",
    justifyContent:  "center",
    flexShrink:      0,
  },

  // ── Verified ──────────────────────────────────────────────────────────────
  verifiedInner: {
    position: "relative",
  },
  verifiedBadgeRow: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           14,
    marginBottom:  14,
    zIndex:        2,
  },
  verifiedIconCircle: {
    width:           50,
    height:          50,
    borderRadius:    25,
    alignItems:      "center",
    justifyContent:  "center",
    shadowColor:     "#10B981",
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.35,
    shadowRadius:    10,
    elevation:       6,
  },
  verifiedTextBlock: {
    flex: 1,
  },
  verifiedTitle: {
    fontSize:   18,
    fontFamily: "OutfitBold",
    color:      "#E5E5E5",
  },
  verifiedLabel: {
    fontSize:   12,
    fontFamily: "OutfitMedium",
    color:      "#34D399",
    marginTop:  2,
    letterSpacing: 0.3,
  },
  verifiedDesc: {
    fontSize:   13,
    fontFamily: "Outfit",
    color:      "#9CA3AF",
    lineHeight: 19,
    marginBottom: 14,
    zIndex:       2,
  },

  // ── Perks ─────────────────────────────────────────────────────────────────
  verifiedPerks: {
    gap:             8,
    zIndex:          2,
  },
  perkRow: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           10,
  },
  perkDot: {
    width:           6,
    height:          6,
    borderRadius:    3,
    backgroundColor: "#10B981",
  },
  perkText: {
    fontSize:   13,
    fontFamily: "OutfitMedium",
    color:      "#D1D5DB",
  },
});