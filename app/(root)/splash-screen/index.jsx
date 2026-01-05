import React, { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import { useAuthRestore } from "../../../hooks/useAuthRestore";
import { determineNextRoute } from "../../../utils/navigationHelper";

const SplashScreen = () => {
  const router = useRouter();

  // 🔐 Restore auth state
  const { restored, token, onboardingToken, pendingEmail } = useAuthRestore();

  // 🎬 Animation values
  const iconScale = useSharedValue(0.9);
  const textOpacity = useSharedValue(0);
  const textTranslate = useSharedValue(20);

  // 🚦 Navigate after auth restore
  const navigate = async () => {
    const nextRoute = await determineNextRoute({
      token,
      onboardingToken,
      pendingEmail,
    });
    if (nextRoute) router.replace(nextRoute);
  };

  // 🔁 Run animation once on mount
  useEffect(() => {
    iconScale.value = withTiming(0.6, { duration: 1000 }, () => {
      textOpacity.value = withTiming(1, { duration: 800 });
      textTranslate.value = withTiming(0, { duration: 800 });
    });
  }, []);

  // 🟢 Navigate ONLY when auth has been restored
  useEffect(() => {
    if (!restored) return;

    // small delay to let animation finish
    const timer = setTimeout(() => {
      runOnJS(navigate)();
    }, 300);

    return () => clearTimeout(timer);
  }, [restored, token, onboardingToken, pendingEmail]);

  // Animated styles
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
