import { useLocalSearchParams, useRouter } from "expo-router";
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

const ResetPassword = () => {
  const { email, resetToken } = useLocalSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  const handleSubmit = async () => {
    if (!password.trim()) {
      showToast({ message: "Please enter a new password", variant: "error" });
      return;
    }

    if (password.length < 8) {
      showToast({
        message: "Password must be at least 8 characters",
        variant: "error",
      });
      return;
    }

    if (password !== confirmPassword) {
      showToast({ message: "Passwords do not match", variant: "error" });
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.resetPassword({
        email,
        resetToken,
        newPassword: password,
      });

      showToast({
        message: response.data?.message || "Password reset successfully!",
        variant: "success",
      });

      // Navigate back to login
      router.replace("/login");
    } catch (err) {
      showToast({
        message:
          err.response?.data?.message ||
          "Failed to reset password. Please try again.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{flex: 1}} className="bg-white">
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{flex: 1}} className="px-2">
            {/* Back */}
            <Pressable
              onPress={() => router.back()}
              className="mt-4 mb-2 w-10 h-10 items-center justify-center"
            >
              <ChevronLeft size={24} color="#111" />
            </Pressable>

            <View style={{flex: 1}} className="mt-4">
              <Text className="text-3xl font-PlusJakartaSansSemiBold text-black">
                Create new password
              </Text>
              <Text className="mb-5 text-black text-lg font-PlusJakartaSans">
                Your new password must be at least 8 characters long. Choose
                something strong that you haven&apos;t used before.
              </Text>

              <TextInput
                placeholder="Enter new password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <TextInput
                placeholder="Confirm new password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>

            <View className="w-full items-end pb-6">
              <Button
                title="Reset Password"
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

export default ResetPassword;
