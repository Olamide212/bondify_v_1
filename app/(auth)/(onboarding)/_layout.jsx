import { Stack, useSegments } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";
import AccountSetupHeader from "../../../components/headers/SetupAccountHeader";
import { ProgressBar } from "../../../components/ui/ProgressBar";
import { useProfileSetup } from "../../../hooks/useProfileSetup";

export default function OnboardingLayout() {
  const segments = useSegments();
  const currentStepSegment = segments[segments.length - 1];
  const isVerificationFlow = segments.includes("verification");
  const logicalStep = isVerificationFlow ? "verification" : currentStepSegment;

  const { steps, progress, resumeStep, setCurrentStep } = useProfileSetup({
    isOnboarding: true,
    trackStep: true,
  });

  useEffect(() => {
    resumeStep();
  }, [resumeStep]);

  useEffect(() => {
    // When inside the verification stack, normalize all subroutes to a single logical step
    const stepToPersist = steps.includes(logicalStep) ? logicalStep : steps[0];
    if (stepToPersist) {
      setCurrentStep(stepToPersist);
    }
  }, [logicalStep, setCurrentStep, steps]);

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
