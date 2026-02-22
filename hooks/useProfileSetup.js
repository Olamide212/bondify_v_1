import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { profileService } from "../services/profileService";
import { clearOnboardingToken } from "../slices/authSlice";
import { tokenManager } from "../utils/tokenManager";

const ONBOARDING_STEPS = [
  "age",
  "height",
  "gender",
  "meet",
  "marital-status",
  "kids",
  "preference",
  "religion",
  "religion-question",
  "education",
  "occupation",
  "smoke",
  "drink",
  "about",
  "interests",
  "upload-photo",
  "profile-answers",
  "location-access"
];

export const useProfileSetup = ({ isOnboarding = true, trackStep = false } = {}) => {
  const dispatch = useDispatch();
  const steps = ONBOARDING_STEPS;

  const [currentStep, setCurrentStep] = useState(steps[0]);
  const [progress, setProgress] = useState(1 / steps.length);
  const [lookups, setLookups] = useState({});
  const [loading, setLoading] = useState(false);

  // -------------------------------
  // Restore saved onboarding step
  // -------------------------------
  const resumeStep = useCallback(async () => {
    try {
      const savedStep = await SecureStore.getItemAsync("onboardingStep");

      if (savedStep && steps.includes(savedStep)) {
        setCurrentStep(savedStep);
      } else {
        // Fallback to first onboarding step
        setCurrentStep(steps[0]);
      }
    } catch (err) {
      console.warn("Failed to restore onboarding step", err);
    }
  }, [steps]);

  // -----------------------------------
  // Persist step & update progress
  // -----------------------------------
  useEffect(() => {
    if (!trackStep) return;

    const persistStep = async () => {
      try {
        await SecureStore.setItemAsync("onboardingStep", currentStep);
        setProgress((steps.indexOf(currentStep) + 1) / steps.length);
      } catch (err) {
        console.warn("Failed to persist onboarding step", err);
      }
    };

    persistStep();
  }, [currentStep, trackStep, steps]);

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
  // Fetch lookup values
  // -----------------------------------
  const fetchLookups = async (type) => {
    try {
      const data = await profileService.getLookups(type);
      setLookups((prev) => ({ ...prev, [type]: data }));
      return data;
    } catch (err) {
      console.error("Fetch lookups error:", err);
      return [];
    }
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
    await SecureStore.deleteItemAsync("onboardingStep");
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
