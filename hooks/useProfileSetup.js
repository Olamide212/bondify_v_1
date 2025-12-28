import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { profileService } from "../services/profileService";

export const useProfileSetup = ({ isOnboarding = true } = {}) => {
  const router = useRouter();

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

  // Resume last step
  const resumeStep = async () => {
    const lastStep = await AsyncStorage.getItem("onboardingStep");
    if (lastStep && steps.includes(lastStep)) {
      setCurrentStep(lastStep);
      setProgress((steps.indexOf(lastStep) + 1) / steps.length);
      router.replace(`/onboarding/${lastStep}`);
    } else if (isOnboarding) {
      router.replace(`/onboarding/${steps[0]}`);
    }
  };

  // Auto-save step
  useEffect(() => {
    AsyncStorage.setItem("onboardingStep", currentStep);
    setProgress((steps.indexOf(currentStep) + 1) / steps.length);
  }, [currentStep]);

  // Fetch lookups for lookup-based fields
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

  // Update profile for current step
  const updateProfileStep = async (fields) => {
    setLoading(true);
    try {
      await profileService.updateProfile(fields);

      // If last step, mark onboarding complete
      if (isOnboarding && currentStep === steps[steps.length - 1]) {
        await profileService.completeOnboarding();
        await AsyncStorage.setItem("onboardingComplete", "true");
      }

      setLoading(false);
    } catch (err) {
      console.error("Update profile error:", err);
      setLoading(false);
      throw err;
    }
  };

  // Navigate to next step
  const nextStep = () => {
    const idx = steps.indexOf(currentStep);
    if (idx < steps.length - 1) {
      const next = steps[idx + 1];
      setCurrentStep(next);
      router.push(`/onboarding/${next}`);
    }
  };

  // Navigate to previous step
  const prevStep = () => {
    const idx = steps.indexOf(currentStep);
    if (idx > 0) {
      const prev = steps[idx - 1];
      setCurrentStep(prev);
      router.push(`/onboarding/${prev}`);
    }
  };

  return {
    currentStep,
    progress,
    steps,
    lookups,
    loading,
    resumeStep,
    fetchLookups,
    updateProfileStep,
    nextStep,
    prevStep,
  };
};
