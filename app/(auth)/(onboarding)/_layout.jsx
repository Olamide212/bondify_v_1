import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useCallback } from "react";
import { View } from "react-native";
import AccountSetupHeader from "../../../components/headers/SetupAccountHeader";
import { ProgressBar } from "../../../components/ui/ProgressBar";
import { useProfileSetup } from "../../../hooks/useProfileSetup";

// Screens that are important and should NOT have skip button
const NON_SKIPPABLE_SCREENS = [
  "agreement",      // Must agree to terms
  "age",            // Required for legal/matching
  "gender",         // Core identity
  "meet",           // What they're looking for
  "preference",     // Partner preferences
  "upload-photo",   // Required for profile visibility
  "verification",   // Identity verification
  "location-access" // Required for matching functionality
];

export default function OnboardingLayout() {
  const router = useRouter();
  const segments = useSegments();
  const currentStepSegment = segments[segments.length - 1];
  const isVerificationFlow = segments.includes("verification");
  const logicalStep = isVerificationFlow ? "verification" : currentStepSegment;

  const { steps, progress, resumeStep, setCurrentStep, getNextStep } = useProfileSetup({
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
  
  // Determine if current screen can be skipped
  const isSkippable = !NON_SKIPPABLE_SCREENS.includes(currentStepSegment);
  
  // Handle skip action - navigate to next step
  const handleSkip = useCallback(() => {
    const currentIdx = steps.indexOf(currentStepSegment);
    if (currentIdx >= 0 && currentIdx < steps.length - 1) {
      const nextStep = steps[currentIdx + 1];
      router.push(`/(onboarding)/${nextStep}`);
    }
  }, [currentStepSegment, steps, router]);

  return (
    <View className="flex-1 bg-white">
      <AccountSetupHeader 
        title="Account Setup" 
        showBack={!isAgreement}
        showSkipButton={isSkippable && steps.includes(currentStepSegment)}
        onSkip={handleSkip}
      />

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
