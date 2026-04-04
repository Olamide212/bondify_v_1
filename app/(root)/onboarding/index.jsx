import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../../../components/ui/Button";
import { colors } from "../../../constant/colors";
import { images } from "../../../constant/images";

const SLIDESHOW_IMAGES = [
  images.onboardingImage,
  images.onboardingImage2,
  images.onboardingImage3,
];

const SLIDE_DURATION = 4500;
const FADE_DURATION = 1800;

// ── Main screen ──────────────────────────────────────────────────────────────
const Onboarding = () => {
  const router = useRouter();
  const count = SLIDESHOW_IMAGES.length;

  // One opacity + scale ref per slide — never remounted
  const opacities = useRef(
    SLIDESHOW_IMAGES.map((_, i) => new Animated.Value(i === 0 ? 1 : 0))
  ).current;
  const scales = useRef(
    SLIDESHOW_IMAGES.map(() => new Animated.Value(1))
  ).current;

  const currentIndex = useRef(0);

  useEffect(() => {
    const transition = () => {
      const cur = currentIndex.current;
      const next = (cur + 1) % count;

      // Reset next slide: invisible, slightly zoomed in
      opacities[next].setValue(0);
      scales[next].setValue(1.08);

      Animated.parallel([
        // Fade current OUT
        Animated.timing(opacities[cur], {
          toValue: 0,
          duration: FADE_DURATION,
          useNativeDriver: true,
        }),
        // Fade next IN
        Animated.timing(opacities[next], {
          toValue: 1,
          duration: FADE_DURATION,
          useNativeDriver: true,
        }),
        // Zoom current continues (subtle push out)
        Animated.timing(scales[cur], {
          toValue: 1.12,
          duration: FADE_DURATION,
          useNativeDriver: true,
        }),
        // Next de-zooms gently as it arrives
        Animated.timing(scales[next], {
          toValue: 1.0,
          duration: FADE_DURATION,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // After transition: reset current slide for its next appearance
        scales[cur].setValue(1);
        currentIndex.current = next;
      });
    };

    // Also kick off the slow Ken Burns zoom on the first slide
    Animated.timing(scales[0], {
      toValue: 1.10,
      duration: SLIDE_DURATION + FADE_DURATION,
      useNativeDriver: true,
    }).start();

    const timer = setInterval(transition, SLIDE_DURATION);
    return () => clearInterval(timer);
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* ── All slides always mounted, opacity-driven ── */}
      {SLIDESHOW_IMAGES.map((src, i) => (
        <Animated.View
          key={i}
          style={[
            StyleSheet.absoluteFill,
            {
              opacity: opacities[i],
              transform: [{ scale: scales[i] }],
            },
          ]}
          pointerEvents="none"
        >
          <Image
            source={src}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
        </Animated.View>
      ))}

      {/* ── Gradient overlay ── */}
      <LinearGradient
        colors={[
          "rgba(55, 31, 125, 0.45)",
          "rgba(55, 31, 125, 0.65)",
          "rgba(55, 31, 125, 0.95)",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* ── Content ── */}
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.inner}>

          {/* Logo */}
          <View style={styles.logoWrap}>
            <Image
              source={require("../../../assets/images/bondies-logo.png")}
              style={styles.logo}
              contentFit="contain"
            />
          </View>

          <View style={{ flex: 1 }} />

          {/* Bottom section */}
          <View style={styles.bottomSection}>

            <Text style={styles.tagline}>
              Find meaningful connections
            </Text>

            <View style={styles.identityRow}>
              <View style={styles.identityLine} />
              <Text style={styles.identityText}>Built for Africans by Africans</Text>
              <View style={styles.identityLine} />
            </View>

            <View style={styles.buttonsWrap}>
              <Button
                title="Continue with Phone Number"
                onPress={() => router.push("/login")}
                className="mb-3"
                textClassName="font-OutfitSemiBold"
                variant="white"
              />
              <Button
                title="Create an Account"
                onPress={() => router.push("/register")}
                style={styles.outlineBtn}
                textClassName="font-OutfitMedium text-white"
                variant="primary"
              />
            </View>


            <Text style={styles.terms}>
              Powered by AI


            </Text>


          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.primary,
    overflow: "hidden",
  },
  safeArea: {
    flex: 1,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 12,
  },

  logoWrap: {
    alignItems: "center",
    paddingTop: 8,
  },
  logo: {
    width: 130,
    height: 44,
  },

  bottomSection: {
    width: "100%",
  },
  tagline: {
    fontSize: 35,
    fontFamily: "OutfitBold",
    color: "#fff",
    textAlign: "center",
    lineHeight: 38,
    marginBottom: 16,
    textShadowColor: "rgba(0,0,0,0.20)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
    textTransform: 'capitalize'
  },

  identityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 24,
  },
  identityLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  identityText: {
    fontSize: 15,
    fontFamily: "OutfitSemiBold",
    color: "rgba(255,255,255,0.9)",
  },

  buttonsWrap: {
    gap: 12,
    marginBottom: 16,
  },
  outlineBtn: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "#fff",
  },

  terms: {
    fontSize: 12,
    fontFamily: "OutfitSemiBold",
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 16,
    letterSpacing: 2,
    textTransform: 'uppercase'

  },
  termsLink: {
    color: "#fff",
    fontFamily: "OutfitBold",
  },
});

export default Onboarding;