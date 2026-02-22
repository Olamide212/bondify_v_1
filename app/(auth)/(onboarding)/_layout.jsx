import { Stack, useSegments } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";
import AccountSetupHeader from "../../../components/headers/SetupAccountHeader";
import { ProgressBar } from "../../../components/ui/ProgressBar";
import { useProfileSetup } from "../../../hooks/useProfileSetup";

export default function OnboardingLayout() {
  const segments = useSegments();
  const currentStepSegment = segments[segments.length - 1];

  const { steps, progress, resumeStep, setCurrentStep } = useProfileSetup({
    isOnboarding: true,
    trackStep: true,
  });

  useEffect(() => {
    resumeStep();
  }, [resumeStep]);

  useEffect(() => {
    if (steps.includes(currentStepSegment)) {
      setCurrentStep(currentStepSegment);
    }
  }, [currentStepSegment, setCurrentStep, steps]);

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
