import { useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { profileService } from "../services/profileService";

export const useProfileSetup = ({ isOnboarding = true } = {}) => {
  const steps = [
    "agreement",
    "username",
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
  ];

  const [currentStep, setCurrentStep] = useState(steps[0]);
  const [progress, setProgress] = useState(1 / steps.length);
  const [lookups, setLookups] = useState({});
  const [loading, setLoading] = useState(false);

  // -------------------------------
  // Restore saved onboarding step
  // -------------------------------
  const resumeStep = async () => {
    try {
      const savedStep = await SecureStore.getItemAsync("onboardingStep");

      if (savedStep && steps.includes(savedStep)) {
        setCurrentStep(savedStep);
      }
    } catch (err) {
      console.warn("Failed to restore onboarding step", err);
    }
  };

  // -----------------------------------
  // Persist step & update progress
  // -----------------------------------
  useEffect(() => {
    const persistStep = async () => {
      try {
        await SecureStore.setItemAsync("onboardingStep", currentStep);
        setProgress((steps.indexOf(currentStep) + 1) / steps.length);
      } catch (err) {
        console.warn("Failed to persist onboarding step", err);
      }
    };

    persistStep();
  }, [currentStep]);

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
  // Fetch lookup values (religion, etc.)
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
  // Update profile for current step
  // -----------------------------------
  const updateProfileStep = async (fields) => {
    setLoading(true);

    try {
      await profileService.updateProfile(fields);

      // 🔑 FINAL STEP → backend decides onboarding completion
      if (isOnboarding && currentStep === steps[steps.length - 1]) {
        await profileService.completeOnboarding();

        await SecureStore.setItemAsync("onboardingComplete", "true");
        await SecureStore.deleteItemAsync("onboardingStep");
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
    fetchLookups,
    updateProfileStep,
  };
};
