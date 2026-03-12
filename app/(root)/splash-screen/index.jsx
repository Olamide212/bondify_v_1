import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useDispatch, useSelector } from "react-redux";
import { useAuthRestore } from "../../../hooks/useAuthRestore";
import { logout } from "../../../slices/authSlice";
import { persistor } from "../../../store/store";
import { determineNextRoute } from "../../../utils/navigationHelper";
import { tokenManager } from "../../../utils/tokenManager";

const NAV_TIMEOUT_MS = 2000;

const SplashScreen = () => {
  const dispatch           = useDispatch();
  const router             = useRouter();
  const hasNavigated       = useRef(false);
  const resetInProgressRef = useRef(false);
  const tapCountRef        = useRef(0);
  const tapResetTimerRef   = useRef(null);

  const { restored, token, onboardingToken } = useAuthRestore();
  const { pendingEmail } = useSelector((state) => state.auth);

  // ── Animations ──────────────────────────────────────────────────────────────
  const iconScale     = useSharedValue(0.9);
  const textOpacity   = useSharedValue(0);
  const textTranslate = useSharedValue(20);
  const taglineOpacity = useSharedValue(0);

  useEffect(() => {
    iconScale.value      = withTiming(0.6, { duration: 800 });
    textOpacity.value    = withTiming(1,   { duration: 600 });
    textTranslate.value  = withTiming(0,   { duration: 600 });
    // Tagline fades in slightly after logo
    setTimeout(() => {
      taglineOpacity.value = withTiming(1, { duration: 700 });
    }, 400);
  }, []);

  // ── Navigation ──────────────────────────────────────────────────────────────
  const navigate = (route) => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;
    router.replace(route);
  };

  useEffect(() => {
    const id = setTimeout(() => {
      if (!hasNavigated.current) {
        console.warn("[SplashScreen] Hard timeout — forcing /onboarding");
        navigate("/onboarding");
      }
    }, NAV_TIMEOUT_MS);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!restored || hasNavigated.current) return;
    determineNextRoute({ token, onboardingToken, pendingEmail })
      .then(navigate)
      .catch(() => navigate("/onboarding"));
  }, [restored]);

  // ── Animated styles ─────────────────────────────────────────────────────────
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity:   textOpacity.value,
    transform: [{ translateX: textTranslate.value }],
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  // ── Emergency reset (7 taps) ─────────────────────────────────────────────
  const performEmergencyReset = async () => {
    if (resetInProgressRef.current) return;
    resetInProgressRef.current = true;
    try {
      await tokenManager.removeTokens();
      const allKeys   = await AsyncStorage.getAllKeys();
      const resetKeys = allKeys.filter(
        (k) => k === "persist:root" || k.startsWith("@bondify/cache/")
      );
      if (resetKeys.length > 0) await AsyncStorage.multiRemove(resetKeys);
      await persistor.purge();
      dispatch(logout());
      navigate("/onboarding");
    } catch {
      navigate("/onboarding");
    } finally {
      resetInProgressRef.current = false;
    }
  };

  const handleDebugTap = () => {
    tapCountRef.current += 1;
    if (tapResetTimerRef.current) clearTimeout(tapResetTimerRef.current);
    tapResetTimerRef.current = setTimeout(() => { tapCountRef.current = 0; }, 1200);

    if (tapCountRef.current >= 7) {
      tapCountRef.current = 0;
      Alert.alert(
        "Emergency Reset",
        "This will clear local session/cache and return to onboarding.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Reset", style: "destructive", onPress: performEmergencyReset },
        ]
      );
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.logoWrap}
        activeOpacity={1}
        onPress={handleDebugTap}
      >
        <Animated.Image
          source={require("../../../assets/images/bondify-icon-white.png")}
          style={[styles.icon, iconStyle]}
          resizeMode="contain"
        />
        <Animated.Image
          source={require("../../../assets/images/bondies-logo-white (1).png")}
          style={[styles.wordmark, textStyle]}
          resizeMode="contain"
        />
      </TouchableOpacity>

      {/* Tagline at bottom */}
      <Animated.View style={[styles.taglineWrap, taglineStyle]}>
        {/* Divider dots */}
        <View style={styles.dotsRow}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
        <Text style={styles.tagline}>Built by Africans, for Africans 🌍</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: "#EE5F2B", // primary orange
    alignItems:      "center",
    justifyContent:  "center",
  },
  logoWrap: {
    alignItems: "center",
  },
  icon: {
    width:  100,
    height: 100,
  },
  wordmark: {
    width:     180,
    height:    80,
    marginTop: -20,
  },
  taglineWrap: {
    position:  "absolute",
    bottom:    48,
    alignItems: "center",
    gap:        10,
  },
  dotsRow: {
    flexDirection: "row",
    gap:           6,
    marginBottom:  6,
  },
  dot: {
    width:           4,
    height:          4,
    borderRadius:    2,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  tagline: {
    fontSize:      13,
    fontFamily:    "PlusJakartaSansMedium",
    color:         "rgba(255,255,255,0.85)",
    letterSpacing: 0.5,
    textAlign:     "center",
  },
});

export default SplashScreen;