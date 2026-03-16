import { useRouter } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import OtpVerificationScreen from "../../../components/common/OtpVerificationScreen";
import { useToast } from "../../../context/ToastContext";
import { resendOtp, verifyOtp } from "../../../slices/authSlice";
import { tokenManager } from "../../../utils/tokenManager";

const Validation = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { showToast } = useToast();

  const { loading, pendingEmail, onboardingToken } = useSelector(
    (state) => state.auth
  );

  const handleSubmit = async (code) => {
    if (!pendingEmail) {
      showToast({
        message: "Email not found. Please restart signup.",
        variant: "error",
      });
      return;
    }

    try {
      const response = await dispatch(
        verifyOtp({
          email: pendingEmail,
          otp: code,
        })
      ).unwrap();

      console.log("✅ OTP Verification COMPLETE");

      await new Promise((resolve) => setTimeout(resolve, 100));
      await tokenManager.debugAllStoredValues();

      showToast({
        message: "OTP verified successfully",
        variant: "success",
      });

      await import("expo-secure-store").then((SecureStore) =>
        SecureStore.setItemAsync("onboardingStep", "agreement")
      );

      console.log("🚀 Navigating to agreement...");
      router.replace("/(onboarding)/agreement");
    } catch (err) {
      console.error("❌ OTP Verification failed:", err);
      showToast({
        message: err || "Invalid verification code",
        variant: "error",
      });
    }
  };

  const handleResend = async () => {
    if (!pendingEmail) {
      showToast({
        message: "Email not found. Please restart signup.",
        variant: "error",
      });
      return;
    }

    try {
      await dispatch(resendOtp({ email: pendingEmail })).unwrap();
      showToast({ message: "OTP resent successfully", variant: "info" });
    } catch (err) {
      showToast({
        message: err || "Failed to resend OTP",
        variant: "error",
      });
    }
  };

  return (
    <OtpVerificationScreen
      title="Enter verification code"
      subtitle="Please enter the verification code sent to"
      email={pendingEmail}
      loading={loading}
      onSubmit={handleSubmit}
      onResend={handleResend}
      submitLabel="Continue"
    />
  );
};

export default Validation;
