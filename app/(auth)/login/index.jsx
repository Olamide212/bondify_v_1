import React, { useState, useEffect } from "react";
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
import TextInput from "../../../components/inputs/TextInput";
import Button from "../../../components/ui/Button";
import { login, clearError } from "../../../slices/authSlice";
import { useToast } from "../../../context/ToastContext";

const EmailLogin = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { showToast } = useToast();

  const { loading, error, token } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      showToast({
        message: "Email and password are required",
        variant: "error",
      });
      return;
    }

    try {
      const result = await dispatch(
        login({ email: formData.email, password: formData.password })
      ).unwrap();

      showToast({
        message: result.message || "Login successful",
        variant: "success",
      });

      if (result.onboardingToken) {
        router.replace("/(onboarding)/agreement");
        return;
      }

      router.replace("/root-tabs");
    } catch (err) {
      if (err?.requiresVerification) {
        showToast({
          message: err.message || "Please verify your account",
          variant: "info",
        });
        router.push("/validation");
        return;
      }

      showToast({ message: err || "Login failed", variant: "error" });
    }
  };

  // Clear previous errors when component mounts
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 px-2">
            <View className="flex-1 mt-8">
              <Text className="text-4xl font-GeneralSansSemiBold text-black">
                Welcome back!
              </Text>
              <Text className="mb-5 text-black text-lg font-Satoshi">
                Login into your Bondies account
              </Text>

              {/* Email */}
              <TextInput
                placeholder="Enter your email address"
                value={formData.email}
                onChangeText={(text) => handleChange("email", text)}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TextInput
                placeholder="Enter your password"
                value={formData.password}
                onChangeText={(text) => handleChange("password", text)}
                secureTextEntry
              />
            </View>

            <View className="w-full items-end pb-6">
              <Button
                title="Login"
                variant="gradient"
                onPress={handleLogin}
                loading={loading}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default EmailLogin;
