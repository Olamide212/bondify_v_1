import * as SecureStore from "expo-secure-store";

// navigationHelper.js - Add debugging
export const determineNextRoute = async ({
  token,
  onboardingToken,
  pendingEmail,
}) => {
  console.log("determineNextRoute called with:", {
    token: token ? "yes" : "no",
    onboardingToken: onboardingToken ? "yes" : "no",
    pendingEmail: pendingEmail ? "yes" : "no",
  });

  // 1️⃣ Fully authenticated user takes priority
  // If we have a valid auth token, go directly to root-tabs
  if (token) {
    console.log("Returning /root-tabs due to token");
    // Clear any stale onboarding data if user is fully authenticated
    if (onboardingToken) {
      console.log("Clearing stale onboarding token as user is fully authenticated");
      try {
        await SecureStore.deleteItemAsync("onboardingStep");
      } catch (error) {
        console.warn("Failed to clear onboarding step:", error);
      }
    }
    return "/root-tabs";
  }

  // 2️⃣ Pending OTP (user started signup but didn't verify)
  if (pendingEmail) {
    console.log("Returning /validation due to pendingEmail");
    return "/validation";
  }

  // 3️⃣ Onboarding flow (user created account but didn't complete profile)
  if (onboardingToken) {
    console.log("Checking onboarding step...");
    try {
      const lastStep = await SecureStore.getItemAsync("onboardingStep");
      console.log("Last step from SecureStore:", lastStep);

      if (lastStep) {
        const route = `/(onboarding)/${lastStep}`;
        console.log("Returning:", route);
        return route;
      }

      console.log("Returning /(onboarding)/age as default");
      return "/(onboarding)/age";
    } catch (error) {
      console.error("Error reading SecureStore:", error);
      return "/(onboarding)/age";
    }
  }

  // 4️⃣ No active auth/onboarding session - new user
  try {
    await SecureStore.deleteItemAsync("onboardingStep");
  } catch (error) {
    console.warn("Failed to clear stale onboarding step:", error);
  }

  console.log("Returning /onboarding - no session found");
  return "/onboarding";
};
