import React, { useState } from "react";
import {
  SafeAreaView,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Pressable,
} from "react-native";
import GlobalPhoneInput from "../../../components/inputs/PhoneInput";
import TextInput from "../../../components/inputs/TextInput";
import { useDispatch, useSelector } from "react-redux";
import { signup } from "../../../slices/authSlice";
import { useToast } from "../../../context/ToastContext";
import Button from "../../../components/ui/Button";
import { ScrollView } from "react-native-gesture-handler";
import { useRouter } from "expo-router";

const Register = () => {
  const [formData, setFormData] = useState({
    countryCode: "",
    phone: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);
  const { showToast } = useToast();
  const router = useRouter();

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSignup = async () => {
    const { firstName, lastName, phone, countryCode, email, password } =
      formData;

    if (!firstName || !lastName || !phone || !email || !password) {
      showToast({
        message: "All fields including password are required",
        variant: "error",
      });
      return;
    }

    // ✅ Enforce 10-digit local number
    if (!/^\d{10}$/.test(phone)) {
      showToast({
        message: "Phone number must be exactly 10 digits",
        variant: "error",
      });
      return;
    }

    try {
      await dispatch(
        signup({
          firstName,
          lastName,
          email,
          phoneNumber: `${phone}`,
          countryCode: countryCode,
          password,
        })
      ).unwrap();

      router.push("/validation");
    } catch (errMessage) {
      showToast({
        message: errMessage || "Signup failed",
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
          <View className="flex-1 px-2">
            {/* Scrollable Inputs */}
            <ScrollView
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
            >
              <Text className="text-3xl font-GeneralSansSemiBold text-black mt-4 mb-1">
                Create an account
              </Text>
              <Text className="text-black text-lg font-Satoshi mb-7">
                Find your perfect match with just a few steps. Sign up now and
                join millions of people finding love on Bondies.
              </Text>

              {/* 📱 Phone Input */}
              <GlobalPhoneInput
                phoneNumber={formData.phone}
                countryCode={formData.countryCode}
                onChangePhoneNumber={(digits) => handleChange("phone", digits)}
                onChangeCountryCode={(code) =>
                  handleChange("countryCode", code)
                }
              />

              <TextInput
                placeholder="First name"
                value={formData.firstName}
                onChangeText={(text) => handleChange("firstName", text)}
              />

              <TextInput
                placeholder="Last name"
                value={formData.lastName}
                onChangeText={(text) => handleChange("lastName", text)}
              />

              <TextInput
                placeholder="Enter your email address"
                keyboardType="email-address"
                autoCapitalize="none"
                value={formData.email}
                onChangeText={(text) => handleChange("email", text)}
              />

              <TextInput
                placeholder="Create a password"
                value={formData.password}
                onChangeText={(text) => handleChange("password", text)}
                secureTextEntry
              />
            </ScrollView>

            {/* Footer */}
            <View className="pb-6">
              <Button
                title="Create Account"
                variant="gradient"
                loading={loading}
                onPress={handleSignup}
              />

              <View className="flex-row justify-center items-center gap-1 mt-4">
                <Text className="text-lg font-GeneralSansMedium">
                  Already have an account?
                </Text>
                <Pressable onPress={() => router.push("/login")}>
                  <Text className="text-lg font-GeneralSansMedium text-primary">
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

export default Register;
