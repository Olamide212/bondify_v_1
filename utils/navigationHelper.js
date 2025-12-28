import AsyncStorage from "@react-native-async-storage/async-storage";
import { store } from "../store/store";

export const determineNextRoute = async () => {
  const state = store.getState();
  const { isAuthenticated, pendingEmail } = state.auth;

  // Pending signup / OTP verification
  if (pendingEmail) return "/validation";

  // Logged-in users
  if (isAuthenticated) {
    const onboardingComplete = await AsyncStorage.getItem("onboardingComplete");

    if (onboardingComplete === "true") return "/root-tabs";

    const lastStep = await AsyncStorage.getItem("onboardingStep");
    if (lastStep) return `/onboarding/${lastStep}`;

    return "/agreement"; 
  }

  // New user → Splash will stay and then handle animation
  return "/onboarding"; // fallback if needed
};
