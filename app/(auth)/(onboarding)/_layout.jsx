import React, { useEffect } from "react";
import { View } from "react-native";
import { Stack, useSegments } from "expo-router";
import AccountSetupHeader from "../../../components/headers/SetupAccountHeader";
import { ProgressBar } from "../../../components/ui/ProgressBar";
import { useProfileSetup } from "../../../hooks/useProfileSetup";

export default function OnboardingLayout() {
  const segments = useSegments();
  const currentStepSegment = segments[segments.length - 1];

  const { steps, progress, resumeStep } = useProfileSetup({
    isOnboarding: true,
  });

  useEffect(() => {
    resumeStep();
  }, []);

  const isAgreement = currentStepSegment === "agreement";

  return (
    <View className="flex-1 bg-white">
      <AccountSetupHeader title="Account Setup" showBack={!isAgreement} />

      {steps.includes(currentStepSegment) && (
        <ProgressBar progress={progress} />
      )}

      <Stack screenOptions={{ headerShown: false }}>
        {steps.map((step) => (
          <Stack.Screen key={step} name={step} />
        ))}
      </Stack>
    </View>
  );
}
