import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useDispatch, useSelector } from "react-redux";
import { colors } from "../../../constant/colors";
import { useAlert } from "../../../context/AlertContext";
import { useAuthRestore } from "../../../hooks/useAuthRestore";
import { logout } from "../../../slices/authSlice";
import { persistor } from "../../../store/store";
import { determineNextRoute } from "../../../utils/navigationHelper";
import { tokenManager } from "../../../utils/tokenManager";

const NAV_TIMEOUT_MS = 5000;

const SplashScreen = () => {
  const dispatch           = useDispatch();
  const router             = useRouter();
  const { showAlert }      = useAlert();
  const hasNavigated       = useRef(false);
  const resetInProgressRef = useRef(false);
  const tapCountRef        = useRef(0);
  const tapResetTimerRef   = useRef(null);

  const { restored, token, onboardingToken } = useAuthRestore();
  const { pendingEmail } = useSelector((state) => state.auth);

  // ── Animations ──────────────────────────────────────────────────────────────
  const iconScale   = useSharedValue(0);
  const iconOpacity = useSharedValue(0);
  const iconGlow    = useSharedValue(1);

  useEffect(() => {
    // Step 1: Fade + spring-scale in from 0 → 1
    iconOpacity.value = withTiming(1, { duration: 500 });
    iconScale.value   = withSpring(1, {
      damping:   8,
      stiffness: 90,
      mass:      0.8,
    });

    // Step 2: After entry, do a gentle pulse loop
    iconGlow.value = withDelay(
      700,
      withRepeat(
        withSequence(
          withTiming(1.08, { duration: 900 }),
          withTiming(1.00, { duration: 900 }),
        ),
        -1,   // infinite
        true  // reverse
      )
    );
  }, []);

  // ── Navigation ──────────────────────────────────────────────────────────────
  const navigate = (route) => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;
    router.replace(route);
  };

  const dismissAllAndReplace = (route) => {
    try {
      router.dismissAll();
    } catch (_error) {
      // ignore when there is no dismissible stack
    }
    hasNavigated.current = true;
    router.replace(route);
  };

  useEffect(() => {
    const id = setTimeout(async () => {
      if (!hasNavigated.current) {
        const persistedToken = await tokenManager.getToken();
        const persistedOnboardingToken = await tokenManager.getOnboardingToken();

        if (persistedOnboardingToken) {
          console.warn("[SplashScreen] Hard timeout — onboarding session pending, going to /onboarding");
          navigate("/onboarding");
        } else if (persistedToken) {
          console.warn("[SplashScreen] Hard timeout — token exists, going to /(tabs)/home");
          navigate("/(tabs)/home");
        } else {
          console.warn("[SplashScreen] Hard timeout — no token, forcing /onboarding");
          navigate("/onboarding");
        }
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
    opacity:   iconOpacity.value,
    transform: [{ scale: iconScale.value * iconGlow.value }],
  }));

  // ── Emergency reset (7 taps) ──���──────────────────────────────────────────
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
      dismissAllAndReplace("/onboarding");
    } catch {
      dismissAllAndReplace("/onboarding");
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
      showAlert({
        icon: "warning",
        title: "Emergency Reset",
        message: "This will clear local session/cache and return to onboarding.",
        actions: [
          { label: "Cancel",  style: "cancel" },
          { label: "Reset",   style: "destructive", onPress: performEmergencyReset },
        ],
      });
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <LinearGradient
      colors={[colors.secondary, colors.primary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
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
      </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex:            1,
    alignItems:      "center",
    justifyContent:  "center",
  },
  logoWrap: {
    alignItems: "center",
  },
  icon: {
    width:  130,
    height: 130,
  },
});

export default SplashScreen;