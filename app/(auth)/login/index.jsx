import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
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
import { useDispatch, useSelector } from "react-redux";
import GlobalPhoneInput from "../../../components/inputs/PhoneInput";
import TextInput from "../../../components/inputs/TextInput";
import Button from "../../../components/ui/Button";
import { useToast } from "../../../context/ToastContext";
import { clearError, login } from "../../../slices/authSlice";

const EmailLogin = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { showToast } = useToast();

  const { loading } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    countryCode: "",
    phoneNumber: "",
    password: "",
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLogin = async () => {
    if (!formData.phoneNumber || !formData.password) {
      showToast({
        message: "Phone number and password are required",
        variant: "error",
      });
      return;
    }

    if (!/^\d{8,15}$/.test(formData.phoneNumber)) {
      showToast({
        message: "Please enter a valid phone number",
        variant: "error",
      });
      return;
    }

    try {
      const payload = {
        phoneNumber: formData.phoneNumber,
        password: formData.password,
      };

      if (formData.countryCode) {
        payload.countryCode = formData.countryCode;
      }

      const result = await dispatch(
        login(payload)
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
              <Text className="text-4xl font-PlusJakartaSansSemiBold text-black">
                Welcome back!
              </Text>
              <Text className="mb-5 text-black text-lg font-PlusJakartaSans">
                Login into your Bondies account
              </Text>

              <GlobalPhoneInput
                phoneNumber={formData.phoneNumber}
                countryCode={formData.countryCode}
                onChangePhoneNumber={(digits) => handleChange("phoneNumber", digits)}
                onChangeCountryCode={(code) => handleChange("countryCode", code)}
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

              <View className="flex-row justify-center items-center gap-1 mt-4 w-full">
                <Text className="text-lg font-PlusJakartaSansMedium">
                  Don&apos;t have an account?
                </Text>
                <Pressable onPress={() => router.push("/register")}>
                  <Text className="text-lg font-PlusJakartaSansMedium text-primary">
                    Sign up
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

export default EmailLogin;
