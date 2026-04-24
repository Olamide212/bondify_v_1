import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import OtpVerificationScreen from "../../../components/common/OtpVerificationScreen";
import { useToast } from "../../../context/ToastContext";
import { authAPI } from "../../../services/authService";

const ForgotPasswordOtp = () => {
  const { email } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  const handleSubmit = async (code) => {
    if (!email) {
      showToast({ message: "Email not found. Please go back.", variant: "error" });
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.verifyForgotPasswordOtp({
        email,
        otp: code,
      });

      const resetToken = response.data?.data?.resetToken;

      showToast({
        message: response.data?.message || "OTP verified successfully",
        variant: "success",
      });

      router.push({
        pathname: "/reset-password",
        params: { email, resetToken },
      });
    } catch (err) {
      showToast({
        message: err.response?.data?.message || "Invalid OTP. Please try again.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      showToast({ message: "Email not found.", variant: "error" });
      return;
    }

    try {
      await authAPI.forgotPassword({ email });
      showToast({ message: "OTP resent successfully", variant: "info" });
    } catch (err) {
      showToast({
        message: err.response?.data?.message || "Failed to resend OTP",
        variant: "error",
      });
    }
  };

  const handleBack = () => {
    router.replace({
      pathname: "/forgot-password",
      params: email ? { email } : undefined,
    });
  };

  return (
    <OtpVerificationScreen
      title="Reset password"
      subtitle="Enter the verification code sent to"
      email={email}
      loading={loading}
      onSubmit={handleSubmit}
      onResend={handleResend}
      onBack={handleBack}
      backButton
      submitLabel="Verify Code"
    />
  );
};

export default ForgotPasswordOtp;
