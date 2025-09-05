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
  const [otp, setOtp] = useState("");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState("");
  const dispatch = useDispatch();
  const router = useRouter();
  const { showToast } = useToast();

  // pull auth state from redux
  const { loading } = useSelector((state) => state.auth);

  const handleSubmit = async () => {
    setTouched(true);

    if (!otp || otp.length < 4) {
      setError("Please enter the 4-digit code");
      return;
    }

    setError("");

    try {
      await dispatch(verifyOtp({ otp })).unwrap();
      showToast({ message: "OTP Verified Successfully", variant: "success" });
      router.push("/agreement");
    } catch (err) {
      showToast({ message: err || "Invalid OTP", variant: "error" });
    }
  };

  const handleResend = async () => {
    try {
      await dispatch(resendOtp()).unwrap();
      showToast({ message: "OTP resent successfully", variant: "info" });
    } catch (err) {
      showToast({ message: err || "Failed to resend OTP", variant: "error" });
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
              Please enter the verification code sent to your phone number
            </Text>

            <GlobalOtpInput
              onTextChange={setOtp}
              onFocus={() => setTouched(true)}
              touched={touched}
              errors={error}
              onResend={handleResend}
            />

            {/* Continue Button */}
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
