import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, TouchableOpacity, View } from "react-native";
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

const SplashScreen = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const hasNavigated = useRef(false);
  const resetInProgressRef = useRef(false);
  const tapCountRef = useRef(0);
  const tapResetTimerRef = useRef(null);
  const [isRouting, setIsRouting] = useState(false);

  // Restore auth state
  const { restored, token, onboardingToken } = useAuthRestore();
  const { pendingEmail } = useSelector((state) => state.auth);

  // Animation values
  const iconScale = useSharedValue(0.9);
  const textOpacity = useSharedValue(0);
  const textTranslate = useSharedValue(20);

  // Run animation once
  useEffect(() => {
    iconScale.value = withTiming(0.6, { duration: 1000 });
    textOpacity.value = withTiming(1, { duration: 800 });
    textTranslate.value = withTiming(0, { duration: 800 });
  }, []);

  // Navigate after auth restoration
  useEffect(() => {
    console.log("Navigation Check:", {
      restored,
      isRouting,
      hasNavigated: hasNavigated.current,
      routerReady: router.isReady,
      token: token ? "exists" : "null",
      pendingEmail: pendingEmail ? "exists" : "null"
    });

    if (!restored || hasNavigated.current || isRouting) return;

    const performNavigation = async () => {
      setIsRouting(true);
      try {
        const nextRoute = await determineNextRoute({
          token,
          onboardingToken,
          pendingEmail,
        });

        console.log("Navigation: Next route =", nextRoute);

        if (nextRoute && !hasNavigated.current) {
          hasNavigated.current = true;
          
          // Small delay to ensure animation completes
          await new Promise(resolve => setTimeout(resolve, 500));
          
          router.replace(nextRoute);
        }
      } catch (error) {
        console.error("Navigation Error:", error);
        // Fallback to onboarding on error
        if (!hasNavigated.current) {
          hasNavigated.current = true;
          router.replace("/onboarding");
        }
      } finally {
        setIsRouting(false);
      }
    };

    performNavigation();
  }, [restored, token, onboardingToken, pendingEmail, router]);

  // Safety timeout fallback
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!hasNavigated.current && restored) {
        console.warn("Splash screen timeout - forcing navigation");
        hasNavigated.current = true;
        router.replace("/onboarding");
      }
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [restored, router]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateX: textTranslate.value }],
  }));

  const performEmergencyReset = async () => {
    if (resetInProgressRef.current) return;
    resetInProgressRef.current = true;

    try {
      await tokenManager.removeTokens();

      const allKeys = await AsyncStorage.getAllKeys();
      const resetKeys = allKeys.filter(
        (key) => key === "persist:root" || key.startsWith("@bondify/cache/")
      );

      if (resetKeys.length > 0) {
        await AsyncStorage.multiRemove(resetKeys);
      }

      await persistor.purge();
      dispatch(logout());

      hasNavigated.current = true;
      router.replace("/onboarding");
    } catch (error) {
      console.error("Emergency reset failed:", error);
      hasNavigated.current = true;
      router.replace("/onboarding");
    } finally {
      resetInProgressRef.current = false;
    }
  };

  const handleDebugTap = () => {
    tapCountRef.current += 1;

    if (tapResetTimerRef.current) {
      clearTimeout(tapResetTimerRef.current);
    }

    tapResetTimerRef.current = setTimeout(() => {
      tapCountRef.current = 0;
    }, 1200);

    if (tapCountRef.current >= 7) {
      tapCountRef.current = 0;

      Alert.alert(
        "Emergency Reset",
        "This will clear local session/cache and return to onboarding.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Reset",
            style: "destructive",
            onPress: performEmergencyReset,
          },
        ]
      );
    }
  };

  return (
    <View className="flex-1 bg-primary items-center justify-center">
      <TouchableOpacity className="items-center" activeOpacity={1} onPress={handleDebugTap}>
        <Animated.Image
          source={require("../../../assets/images/bondify-icon-white.png")}
          style={[{ width: 100, height: 100 }, iconStyle]}
          resizeMode="contain"
        />
        <Animated.Image
          source={require("../../../assets/images/bondies-logo-white (1).png")}
          style={[{ width: 180, height: 80, marginTop: -20 }, textStyle]}
          resizeMode="contain"
        />
      </TouchableOpacity>
    </View>
  );
};

export default SplashScreen;