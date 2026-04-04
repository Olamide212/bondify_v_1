import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useState } from "react";
import {
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    SafeAreaView,
    Text,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import TextInput from "../../../components/inputs/TextInput";
import Button from "../../../components/ui/Button";
import { useToast } from "../../../context/ToastContext";
import { authAPI } from "../../../services/authService";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  const handleSubmit = async () => {
    if (!email.trim()) {
      showToast({ message: "Please enter your email address", variant: "error" });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showToast({ message: "Please enter a valid email address", variant: "error" });
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.forgotPassword({
        email: email.trim().toLowerCase(),
      });

      showToast({
        message: response.data?.message || "OTP sent to your email",
        variant: "success",
      });

      router.push({
        pathname: "/forgot-password-otp",
        params: { email: email.trim().toLowerCase() },
      });
    } catch (err) {
      showToast({
        message:
          err.response?.data?.message || "Failed to send OTP. Please try again.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{flex: 1}} className="bg-[#121212]" style={{flex: 1}}>
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{flex: 1}} className="px-2">
         

            <View style={{flex: 1}} className="mt-4">
              <Text className="text-3xl font-OutfitSemiBold text-white">
                Forgot password?
              </Text>
              <Text className="mb-5 text-white text-lg font-Outfit">
                Enter the email address associated with your account and
                we&apos;ll send you a verification code to reset your password.
              </Text>

              <TextInput
                placeholder="Enter your email address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View className="w-full items-end pb-6">
              <Button
                title="Send Verification Code"
                variant="primary"
                onPress={handleSubmit}
                loading={loading}
              />

              <View className="flex-row justify-center items-center gap-1 mt-4 w-full">
                <Text className="text-lg font-OutfitMedium">
                  Remember your password?
                </Text>
                <Pressable onPress={() => router.back()}>
                  <Text className="text-lg font-OutfitMedium text-primary">
                    Login
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ForgotPassword;
