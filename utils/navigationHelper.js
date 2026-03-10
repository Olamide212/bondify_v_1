import * as SecureStore from "expo-secure-store";

/**
 * Determines the next route after auth restoration.
 *
 * Hard contract: resolves in ≤ 1 500 ms no matter what.
 * - SecureStore reads race against a 800 ms timeout so a slow keychain
 *   never blocks the whole splash screen.
 */

const SECURE_STORE_TIMEOUT_MS = 800;

// SecureStore.getItemAsync wrapped with a timeout so it never hangs.
const getItemSafe = (key) =>
  Promise.race([
    SecureStore.getItemAsync(key).catch(() => null),
    new Promise((resolve) => setTimeout(() => resolve(null), SECURE_STORE_TIMEOUT_MS)),
  ]);

export const determineNextRoute = async ({ token, onboardingToken, pendingEmail }) => {
  // 1. No session at all → onboarding
  if (!token && !onboardingToken) {
    // Fire-and-forget — don't await, we already know the route
    SecureStore.deleteItemAsync("onboardingStep").catch(() => {});
    return "/onboarding";
  }

  // 2. Pending OTP verification
  if (pendingEmail) return "/validation";

  // 3. Onboarding in progress — read last step (with timeout so it never hangs)
  if (onboardingToken) {
    const lastStep = await getItemSafe("onboardingStep");
    if (lastStep) return `/(onboarding)/${lastStep}`;
    return "/(onboarding)/age";
  }

  // 4. Fully authenticated
  if (token) return "/root-tabs";

  // 5. Fallback
  return "/onboarding";
};