/**
 * Determine the next route for the app based on restored auth
 * @param {string|null} token - main app token (user logged in)
 * @param {string|null} onboardingToken - onboarding token (user in setup flow)
 * @param {string|null} pendingEmail - optional, if user has pending OTP
 * @returns {string} next route path
 */
export const determineNextRoute = async ({
  token,
  onboardingToken,
  pendingEmail,
}) => {
  // -----------------------------------
  // 1️⃣ Pending OTP always wins
  // -----------------------------------
  if (pendingEmail) {
    return "/validation";
  }

  // -----------------------------------
  // 2️⃣ Authenticated users
  // -----------------------------------
  if (token) {
    // Check if onboarding is complete
    if (!onboardingToken) {
      // User has completed onboarding → go to main app
      return "/root-tabs";
    } else {
      // User still onboarding → load last step from SecureStore
      const lastStep = await import("expo-secure-store").then((SecureStore) =>
        SecureStore.getItemAsync("onboardingStep")
      );

      if (lastStep) {
        return `/(onboarding)/${lastStep}`;
      }

      // Default onboarding entry
      return "/(onboarding)/agreement";
    }
  }

  // -----------------------------------
  // 3️⃣ Not authenticated
  // -----------------------------------
  return "/onboarding";
};
