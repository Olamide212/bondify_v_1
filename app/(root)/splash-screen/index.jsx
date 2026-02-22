import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import { useSelector } from "react-redux";
import { useAuthRestore } from "../../../hooks/useAuthRestore";
import { determineNextRoute } from "../../../utils/navigationHelper";

const SplashScreen = () => {
  const router = useRouter();
  const hasNavigated = useRef(false);
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
        // Fallback to welcome on error
        if (!hasNavigated.current) {
          hasNavigated.current = true;
          router.replace("/welcome");
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
        router.replace("/welcome");
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

  return (
    <View className="flex-1 bg-primary items-center justify-center">
      <View className="items-center">
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
      </View>
    </View>
  );
};

export default SplashScreen;