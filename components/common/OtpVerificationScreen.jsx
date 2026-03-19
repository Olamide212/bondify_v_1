/**
 * components/common/OtpVerificationScreen.jsx
 *
 * Reusable OTP verification screen component.
 * Used for: signup verification, forgot-password verification, email-change verification, etc.
 *
 * Props:
 *   title        – main heading text
 *   subtitle     – description shown below heading (can include email reference)
 *   email        – the email the OTP was sent to (displayed in subtitle if provided)
 *   loading      – whether the submit button shows a spinner
 *   onSubmit     – called with the entered OTP code string
 *   onResend     – called when user taps "Resend"
 *   onBack       – called when user taps the back arrow (optional)
 *   submitLabel  – label for the submit button (default: "Continue")
 */

import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useState } from "react";
import {
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import GlobalOtpInput from "../inputs/OtpInput";
import Button from "../ui/Button";

const OtpVerificationScreen = ({
  title = "Enter verification code",
  subtitle,
  email,
  loading = false,
  onSubmit,
  onResend,
  onBack,
  submitLabel = "Continue",
  backButton = false,
}) => {
  const [code, setCode] = useState("");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = () => {
    setTouched(true);

    if (!code || code.length < 4) {
      setError("Please enter the 4-digit code");
      return;
    }

    setError("");
    onSubmit?.(code);
  };

  const handleResend = () => {
    onResend?.();
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const displaySubtitle =
    subtitle ||
    (email
      ? `Please enter the verification code sent to`
      : "Please enter the verification code sent to your email");

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 px-2 mt-4">
         {/* Back button */}
            {backButton && (
  <TouchableOpacity
              onPress={handleBack}
              className="mb-4 w-10 h-10 items-center justify-center"
            >
              <ChevronLeft size={24} color="#111" />
            </TouchableOpacity>
            )}
   
          

            <Text className="text-3xl font-PlusJakartaSansBold text-black">
              {title}
            </Text>

            <Text className="mb-7 text-black text-xl font-PlusJakartaSans">
              {displaySubtitle}
              {email ? (
                <>
                  {" "}
                  <Text className="font-PlusJakartaSansSemiBold">{email}</Text>
                </>
              ) : null}
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
                title={submitLabel}
                variant="primary"
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

export default OtpVerificationScreen;
