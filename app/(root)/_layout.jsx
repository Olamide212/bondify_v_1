import { Stack, useRouter, useSegments } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useAuthRestore } from "../../hooks/useAuthRestore";

export default function _layout() {
  const router = useRouter();
  const segments = useSegments();
  const { restored, isAuthenticated, hasOnboardingSession } = useAuthRestore();
  const { pendingEmail } = useSelector((state) => state.auth);
  const currentRoute = segments[segments.length - 1];

  useEffect(() => {
    if (!restored) return;

    const publicRoutes = new Set(["splash-screen", "welcome", "onboarding"]);
    const isProtectedRoute = !publicRoutes.has(currentRoute);

    if (!isProtectedRoute) return;

    if (pendingEmail) {
      router.replace("/validation");
      return;
    }

    if (hasOnboardingSession) {
      const redirectToOnboarding = async () => {
        const lastStep = await SecureStore.getItemAsync("onboardingStep");
        router.replace(lastStep ? `/(onboarding)/${lastStep}` : "/(onboarding)/age");
      };

      redirectToOnboarding();
      return;
    }

    if (!isAuthenticated) {
      router.replace("/welcome");
    }
  }, [
    restored,
    isAuthenticated,
    hasOnboardingSession,
    pendingEmail,
    currentRoute,
    router,
  ]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tab)" />
      <Stack.Screen name="splash-screen" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="welcome" />
      <Stack.Screen name="(profile)" />
      <Stack.Screen name="(discover)" />
      <Stack.Screen name="user-profile"  />
      <Stack.Screen name="(settings)" />

      <Stack.Screen
        name="filter"
        options={{
          presentation: "modal", 
          animation: "slide_from_bottom", 
          gestureDirection: "vertical", 
          headerShown: false,
        }}
      />
    </Stack>
  );
}
