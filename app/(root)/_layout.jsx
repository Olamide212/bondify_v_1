import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { useSelector } from "react-redux";
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

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();

  const {
    authRestored: restored,
    isAuthenticated,
    onboardingToken,
    pendingEmail,
  } = useSelector((state) => state.auth);

  const currentRoute = segments[segments.length - 1];

  useEffect(() => {
    if (!restored) return;

    const isInsideRootGroup = segments[0] === "(root)";
    if (!isInsideRootGroup) return;

    const publicRoutes = new Set(["splash-screen", "welcome", "onboarding"]);
    const isProtectedRoute = !publicRoutes.has(currentRoute);

    if (pendingEmail) {
      router.replace("/validation");
      return;
    }

    if (onboardingToken && isAuthenticated && currentRoute !== "splash-screen") {
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

    if (!isProtectedRoute) return;

    if (!isAuthenticated) {
      router.replace("/onboarding");
    }
  }, [
    restored,
    isAuthenticated,
    onboardingToken,
    pendingEmail,
    currentRoute,
    segments,
    router,
  ]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="splash-screen/index" />
      <Stack.Screen name="onboarding/index" />
      <Stack.Screen name="welcome/index" />
      <Stack.Screen name="(profile)" />
      <Stack.Screen name="(discover)" />
      <Stack.Screen name="(community)" />
      <Stack.Screen name="(settings)" />
      <Stack.Screen
        name="user-profile/[id]"
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
          gestureDirection: "vertical",
        }}
      />
      <Stack.Screen name="feed-profile/index" />
      <Stack.Screen name="user-feed-profile/[id]" />
      <Stack.Screen name="edit-user-feed-profile/index" />
      <Stack.Screen name="unmatched-users/index" />
      <Stack.Screen name="bondup-chat/index" />
      <Stack.Screen name="bondup-profile/[id]" />
      <Stack.Screen name="social-profile/[id]" />
      <Stack.Screen name="chat-screen/index" />
      <Stack.Screen name="chat-options/index" />
      <Stack.Screen name="bon-bot/index" />
      <Stack.Screen name="verification/index" />
      <Stack.Screen
        name="filter/index"
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