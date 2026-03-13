/**
 * app/(auth)/(onboarding)/verification/index.jsx
 * Redirect to intro - the actual verification flow is now split into separate screens
 */

import { useRouter } from "expo-router";
import { useEffect } from "react";

export default function VerificationIndex() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/(onboarding)/verification/intro");
  }, [router]);

  return null;
}
