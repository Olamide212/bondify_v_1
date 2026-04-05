import { Stack, useRouter, useSegments } from "expo-router";
import { useCallback, useEffect } from "react";
import { View } from "react-native";
import AccountSetupHeader from "../../../components/headers/SetupAccountHeader";
import { ProgressBar } from "../../../components/ui/ProgressBar";
import { VerificationStepProvider, useVerificationStep } from "../../../context/VerificationStepContext";
import { useProfileSetup } from "../../../hooks/useProfileSetup";

// Screens that show Skip in the header → maps to the next screen
const SKIP_MAP = {
  ethnicity:              "/gender",
  "marital-status":       "/meet",
  meet:                   "/preference",
  preference:             "/religion",
  religion:               "/religion-question",
  "religion-question":    "/religion-practice",
  "religion-practice":    "/relocation-preference",
  "relocation-preference":"/kids",
  kids:                   "/education",
  education:              "/occupation",
  occupation:             "/smoke",
  smoke:                  "/drink",
  drink:                  "/interests",
  interests:              "/about",
};

export default function OnboardingLayout() {
  return (
    <VerificationStepProvider>
      <OnboardingContent />
    </VerificationStepProvider>
  );
}

function OnboardingContent() {
  const router = useRouter();
  const segments = useSegments();
  const currentStepSegment = segments[segments.length - 1];
  const isVerificationFlow = segments.includes("verification");
  const logicalStep = isVerificationFlow ? "verification" : currentStepSegment;
  const { verificationStep } = useVerificationStep();
  const hideHeader = isVerificationFlow && verificationStep === "camera";

  const { steps, progress, resumed, resumeStep, setCurrentStep } = useProfileSetup({
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
  const skipTarget = SKIP_MAP[currentStepSegment];

  const handleSkip = useCallback(() => {
    if (skipTarget) router.push(skipTarget);
  }, [skipTarget, router]);

  return (
    <View style={{flex: 1}} className="bg-[#121212]">
      {!hideHeader && (
        <View style={isVerificationFlow ? { paddingHorizontal: 16 } : undefined}>
          <AccountSetupHeader
            title="Account Setup"
            showBack={!isAgreement}
            onSkip={skipTarget ? handleSkip : undefined}
          />
        </View>
      )}

      {!hideHeader && resumed && steps.includes(currentStepSegment) && (
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
