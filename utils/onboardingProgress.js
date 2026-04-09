import * as SecureStore from "expo-secure-store";

const ONBOARDING_STEP_KEY = "onboardingStep";

const getSessionKey = ({ token, onboardingToken } = {}) => {
  const source = onboardingToken || token;
  if (!source || typeof source !== "string") return null;
  return source.slice(-24);
};

const readStoredProgress = async () => {
  const raw = await SecureStore.getItemAsync(ONBOARDING_STEP_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && typeof parsed.step === "string") {
      return parsed;
    }
  } catch {
    // Legacy installs stored the step as a plain string.
  }

  return {
    step: raw,
    sessionKey: null,
    legacy: true,
  };
};

export const getStoredOnboardingStep = async ({ steps = [], token, onboardingToken } = {}) => {
  const stored = await readStoredProgress();
  if (!stored?.step || !steps.includes(stored.step)) return null;

  const currentSessionKey = getSessionKey({ token, onboardingToken });
  if (!currentSessionKey) return null;

  if (!stored.sessionKey) {
    // Ignore legacy/global progress so a different or deleted account cannot
    // resume another person's onboarding state.
    return null;
  }

  if (stored.sessionKey !== currentSessionKey) return null;
  return stored.step;
};

export const saveOnboardingStep = async ({ step, token, onboardingToken } = {}) => {
  if (!step) return;

  const sessionKey = getSessionKey({ token, onboardingToken });
  if (!sessionKey) return;

  await SecureStore.setItemAsync(
    ONBOARDING_STEP_KEY,
    JSON.stringify({
      step,
      sessionKey,
      updatedAt: Date.now(),
    })
  );
};

export const clearOnboardingStep = async () => {
  await SecureStore.deleteItemAsync(ONBOARDING_STEP_KEY);
};

export const getOnboardingResumeRoute = async ({
  steps = [],
  token,
  onboardingToken,
  fallback = "/(onboarding)/agreement",
} = {}) => {
  const step = await getStoredOnboardingStep({ steps, token, onboardingToken });
  return step ? `/(onboarding)/${step}` : fallback;
};
