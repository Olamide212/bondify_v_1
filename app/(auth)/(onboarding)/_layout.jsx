import React, { useEffect } from "react";
import { View } from "react-native";
import { Stack, useSegments } from "expo-router";
import AccountSetupHeader from "../../../components/headers/SetupAccountHeader";
import { ProgressBar } from "../../../components/ui/ProgressBar";
import { useProfileSetup } from "../../../hooks/useProfileSetup";

export default function OnboardingLayout() {
  const segments = useSegments(); // e.g., ['auth', '(onboarding)', 'gender']
  const currentStepSegment = segments[segments.length - 1];

  const { currentStep, progress, steps, resumeStep } = useProfileSetup({
    isOnboarding: true,
  });

  // When layout mounts, resume last step if exists
  useEffect(() => {
    resumeStep();
  }, []);

  return (
    <View className="flex-1 bg-white">
      <AccountSetupHeader title="Account Setup" />
      {steps.includes(currentStepSegment) && (
        <ProgressBar progress={progress} />
      )}

      <Stack screenOptions={{ headerShown: false }}>
        {steps.map((step) => (
          <Stack.Screen key={step} name={step} />
        ))}
        <Stack.Screen name="location" />
      </Stack>
    </View>
  );
}
