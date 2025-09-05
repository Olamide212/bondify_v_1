import React, { useEffect } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";

const SplashScreen = () => {
  const router = useRouter();

  const iconScale = useSharedValue(0.9);
  const textOpacity = useSharedValue(0);
  const textTranslate = useSharedValue(20);

  const navigateToOnboarding = () => {
    router.replace("/onboarding");
  };

  useEffect(() => {
    // First: Animate logo scale
    iconScale.value = withTiming(0.6, { duration: 1000 }, () => {
      // Then: Animate text
      textOpacity.value = withTiming(1, { duration: 800 });
      textTranslate.value = withTiming(0, { duration: 800 }, () => {
        // After all animations, navigate
        runOnJS(navigateToOnboarding)();
      });
    });
  }, []);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateX: textTranslate.value }],
  }));

  return (
    <View className="flex-1 bg-primary items-center justify-center">
      <View className="flex-col items-center justify-center">
        <Animated.Image
          source={require("../../../assets/images/bondify-icon-white.png")}
          style={[{ width: 100, height: 100 }, iconStyle]}
          resizeMode="contain"
        />
        <Animated.Image
          source={require("../../../assets/images/bondies-logo-white (1).png")}
          style={[{ width: 180, height: 80, marginTop: -20  }, textStyle]}
          resizeMode="contain"
        />
      </View>
    </View>
  );
};

export default SplashScreen;
