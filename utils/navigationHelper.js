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

  // 1️⃣ Pending OTP
  if (pendingEmail) {
    console.log("Returning /validation due to pendingEmail");
    return "/validation";
  }

  // 2️⃣ Onboarding flow (must take priority over token when onboarding isn't complete)
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

  // 3️⃣ Fully authenticated
  if (token) {
    console.log("Returning /root-tabs due to token");
    return "/root-tabs";
  }

  // 4️⃣ New/unauthenticated user
  return "/onboarding";
};
