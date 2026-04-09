import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import HeaderWithLogo from "../../components/headers/HeaderWithLogo";
import { useAuthRestore } from "../../hooks/useAuthRestore";
import { getOnboardingResumeRoute } from "../../utils/onboardingProgress";

const ONBOARDING_STEPS = [
  "agreement",
  "age",
  "ethnicity",
  "gender",
  "marital-status",
  "meet",
  "preference",
  "religion",
  "religion-question",
  "religion-practice",
  "relocation-preference",
  "kids",
  "education",
  "occupation",
  "smoke",
  "drink",
  "interests",
  "about",
  "profile-answers",
  "upload-photo",
  "verification",
  "location-access",
];

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

  // Pre-auth screens that users explicitly navigate to  these should
  // never be interrupted by the onboarding-token redirect.
  const isPreAuthScreen = isLogin || isRegister || isForgotPassword || isResetPassword;

  useEffect(() => {
    if (!restored) return;

    if (pendingEmail) {
      router.replace("/validation");
      return;
    }

    if (onboardingToken && isAuthenticated && !isOnboarding && !isPreAuthScreen) {
      const redirectToOnboarding = async () => {
        const route = await getOnboardingResumeRoute({
          steps: ONBOARDING_STEPS,
          token: null,
          onboardingToken,
        });
        router.replace(route);
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
    <SafeAreaView className="flex-1" style={{backgroundColor: '#121212'}}>
      {!isOnboarding && <HeaderWithLogo showBackButton={!isLogin} />}
      <StatusBar style="light" />
      <Stack screenOptions={{
    headerShown: false,
    gestureEnabled: false,
    contentStyle: { backgroundColor: "#121212" },
    cardOverlayEnabled: false,
  }}>
        <Stack.Screen name="login/index" />
        <Stack.Screen name="register/index" />
        <Stack.Screen name="reset-password/index" />
        <Stack.Screen name="forgot-password/index" />
        <Stack.Screen name="forgot-password-otp/index" />
        <Stack.Screen name="validation/index" />
        <Stack.Screen name="(onboarding)" />
      </Stack>
    </SafeAreaView>
  );
}
