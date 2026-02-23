import { Stack, useRouter, useSegments } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import HeaderWithLogo from "../../components/headers/HeaderWithLogo";
import { useAuthRestore } from "../../hooks/useAuthRestore";

export default function AuthLayout() {
  const router = useRouter();
  const segments = useSegments(); // returns an array like ['auth', '(onboarding)', 'birthday']
  const { restored, isAuthenticated, onboardingToken } = useAuthRestore();
  const { pendingEmail } = useSelector((state) => state.auth);

  // Check if user is on an onboarding screen
  const isOnboarding = segments.includes("(onboarding)");
  const isLogin = segments.includes("login");
  const isRegister = segments.includes("register");
  const isForgotPassword = segments.includes("forgot-password");
  const isResetPassword = segments.includes("reset-password");

  // Pre-auth screens that users explicitly navigate to — these should
  // never be interrupted by the onboarding-token redirect.
  const isPreAuthScreen = isLogin || isRegister || isForgotPassword || isResetPassword;

  useEffect(() => {
    if (!restored) return;

    if (pendingEmail) {
      router.replace("/validation");
      return;
    }

    if (onboardingToken && !isOnboarding && !isPreAuthScreen) {
      const redirectToOnboarding = async () => {
        const lastStep = await SecureStore.getItemAsync("onboardingStep");
        router.replace(lastStep ? `/(onboarding)/${lastStep}` : "/(onboarding)/age");
      };

      redirectToOnboarding();
      return;
    }

    if (isAuthenticated && !onboardingToken && !isOnboarding) {
      router.replace("/root-tabs");
    }
  }, [
    restored,
    pendingEmail,
    onboardingToken,
    isOnboarding,
    isPreAuthScreen,
    isAuthenticated,
    router,
  ]);

  return (
    <SafeAreaView className={"flex-1 bg-white px-4"}>
      {!isOnboarding && <HeaderWithLogo showBackButton={!isLogin} />}
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, gestureEnabled: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="reset-password" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="validation" />
        <Stack.Screen name="(onboarding)" />
      </Stack>
    </SafeAreaView>
  );
}
