import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getLookupOptions } from "../data/lookupData";
import { profileService } from "../services/profileService";
import { clearOnboardingToken } from "../slices/authSlice";
import { clearOnboardingStep, getStoredOnboardingStep, saveOnboardingStep } from "../utils/onboardingProgress";
import { tokenManager } from "../utils/tokenManager";

const ONBOARDING_STEPS = [
  "agreement",
  "age",
  // "height",
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
  // "voice-prompt",
  // "profile-prompts",
  "profile-answers",
  // "favorite-music",
  // "favorite-videos",
  // "fun-activities",
  "upload-photo",
  "verification",
  "location-access"
];

export const useProfileSetup = ({ isOnboarding = true, trackStep = false } = {}) => {
  const dispatch = useDispatch();
  const { token, onboardingToken } = useSelector((state) => state.auth);
  const steps = ONBOARDING_STEPS;

  const [currentStep, setCurrentStep] = useState(steps[0]);
  const [progress, setProgress] = useState(0);
  const [lookups, setLookups] = useState({});
  const [loading, setLoading] = useState(false);
  const [resumed, setResumed] = useState(false);

  // -------------------------------
  // Restore saved onboarding step
  // -------------------------------
  const resumeStep = useCallback(async () => {
    try {
      const savedStep = await getStoredOnboardingStep({
        steps,
        token,
        onboardingToken,
      });

      if (savedStep && steps.includes(savedStep)) {
        setCurrentStep(savedStep);
        setProgress((steps.indexOf(savedStep) + 1) / steps.length);
      } else {
        // Fallback to first onboarding step
        setCurrentStep(steps[0]);
        setProgress(1 / steps.length);
      }
    } catch (err) {
      console.warn("Failed to restore onboarding step", err);
      setProgress(1 / steps.length);
    } finally {
      setResumed(true);
    }
  }, [onboardingToken, steps, token]);

  // -----------------------------------
  // Persist step & update progress
  // -----------------------------------
  useEffect(() => {
    if (!trackStep) return;

    const persistStep = async () => {
      try {
        await saveOnboardingStep({
          step: currentStep,
          token,
          onboardingToken,
        });
        setProgress((steps.indexOf(currentStep) + 1) / steps.length);
      } catch (err) {
        console.warn("Failed to persist onboarding step", err);
      }
    };

    persistStep();
  }, [currentStep, onboardingToken, token, trackStep, steps]);

  // -----------------------------------
  // Helpers
  // -----------------------------------
  const getNextStep = () => {
    const idx = steps.indexOf(currentStep);
    return idx < steps.length - 1 ? steps[idx + 1] : null;
  };

  const getPrevStep = () => {
    const idx = steps.indexOf(currentStep);
    return idx > 0 ? steps[idx - 1] : null;
  };

  // -----------------------------------
  // Get lookup values (now uses local data)
  // -----------------------------------
  const fetchLookups = (type) => {
    const data = getLookupOptions(type);
    setLookups((prev) => ({ ...prev, [type]: data }));
    return data;
  };

  // -----------------------------------
  // Move to the next step
  // -----------------------------------
  const nextStep = async () => {
    const next = getNextStep();
    if (next) {
      setCurrentStep(next);
    } else {
      await updateProfileStep({});
    }
  };

  const finalizeOnboarding = useCallback(async () => {
    await profileService.completeOnboarding();
    await SecureStore.setItemAsync("onboardingComplete", "true");
    await clearOnboardingStep();
    await tokenManager.setToken({ onboardingToken: null });
    dispatch(clearOnboardingToken());
  }, [dispatch]);

  // -----------------------------------
  // Update profile for current step
  // -----------------------------------
  const updateProfileStep = async (fields) => {
    setLoading(true);

    try {
      if (Object.keys(fields).length > 0) {
        await profileService.updateProfile(fields);
      }

      if (isOnboarding && currentStep === steps[steps.length - 1]) {
        await finalizeOnboarding();
      }
    } catch (err) {
      console.error("Update profile step error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    steps,
    currentStep,
    progress,
    lookups,
    loading,
    resumed,

    setCurrentStep,
    resumeStep,
    getNextStep,
    getPrevStep,
    nextStep,
    fetchLookups,
    updateProfileStep,
    finalizeOnboarding,
  };
};
