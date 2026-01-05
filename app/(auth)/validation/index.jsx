import React, { useState } from "react";
import {
  SafeAreaView,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useRouter } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { verifyOtp, resendOtp } from "../../../slices/authSlice";
import { useToast } from "../../../context/ToastContext";
import GlobalOtpInput from "../../../components/inputs/OtpInput";
import Button from "../../../components/ui/Button";

const Validation = () => {
  const [code, setCode] = useState("");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState("");

  const dispatch = useDispatch();
  const router = useRouter();
  const { showToast } = useToast();

  // Pull required auth state
  const { loading, pendingEmail } = useSelector((state) => state.auth);
const handleSubmit = async () => {
  setTouched(true);

  if (!code || code.length < 4) {
    setError("Please enter the 4-digit code");
    return;
  }

  if (!pendingEmail) {
    showToast({
      message: "Email not found. Please restart signup.",
      variant: "error",
    });
    return;
  }

  try {
    await dispatch(
      verifyOtp({
        email: pendingEmail,
        code,
      })
    ).unwrap();

    showToast({
      message: "OTP verified successfully",
      variant: "success",
    });

    router.replace("/(onboarding)/agreement");
  } catch (err) {
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
      showToast({
        message: "OTP resent successfully",
        variant: "info",
      });
    } catch (err) {
      showToast({
        message: err || "Failed to resend OTP",
        variant: "error",
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 px-2 mt-8">
            <Text className="text-3xl font-GeneralSansSemiBold text-black">
              Enter verification code
            </Text>

            <Text className="mb-7 text-black text-lg font-GeneralSans">
              Please enter the verification code sent to{" "}
              <Text className="font-GeneralSansSemiBold">{pendingEmail}</Text>
            </Text>

            <GlobalOtpInput
              onTextChange={setCode}
              onFocus={() => setTouched(true)}
              touched={touched}
              errors={error}
              onResend={handleResend}
            />

            <View className="w-full items-end mt-8">
              <Button
                title="Continue"
                variant="gradient"
                onPress={handleSubmit}
                loading={loading}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Validation;
