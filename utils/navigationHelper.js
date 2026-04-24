import * as SecureStore from "expo-secure-store";
import { getOnboardingResumeRoute } from "./onboardingProgress";

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

// navigationHelper.js
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

  // 1️⃣ Pending OTP (user started signup but didn't verify email)
  if (pendingEmail) {
    console.log("Returning /validation due to pendingEmail");
    return "/validation";
  }

  // 2️⃣ Onboarding not completed — user has an onboarding token
  // This takes priority even if user also has an auth token, because
  // onboardingToken is only present when onboardingCompleted === false.
  if (onboardingToken) {
    console.log("Checking onboarding step...");
    try {
      const route = await getOnboardingResumeRoute({
        steps: ONBOARDING_STEPS,
        token,
        onboardingToken,
      });
      console.log("Returning:", route);
      return route;
    } catch (error) {
      console.error("Error reading SecureStore:", error);
      return "/(onboarding)/agreement";
    }
  }

  // 3️⃣ Fully authenticated user with completed onboarding
  if (token) {
    console.log("Returning /(tabs)/home due to token (onboarding complete)");
    return "/(tabs)/home";
  }

  // 4️⃣ No active auth/onboarding session — new user
  try {
    await SecureStore.deleteItemAsync("onboardingStep");
  } catch (error) {
    console.warn("Failed to clear stale onboarding step:", error);
  }

  console.log("Returning /onboarding - no session found");
  return "/onboarding";
};
