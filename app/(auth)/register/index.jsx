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
  Alert,
} from "react-native";
import GlobalPhoneInput from "../../../components/inputs/PhoneInput";
import NextButton from "../../../components/ui/NextButton";
import { useRouter } from "expo-router";
import TextInput from "../../../components/inputs/TextInput";
import { useDispatch, useSelector } from "react-redux";
import { signup } from "../../../slices/authSlice";
import { useToast } from "../../../context/ToastContext";
import Button from "../../../components/ui/Button"
import { ScrollView } from "react-native-gesture-handler";

const Register = () => {
  const [formData, setFormData] = useState({
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

  // reusable handler
  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSignup = async () => {
    const { firstName, lastName, phone, email, password} =
      formData;

    if (!firstName || !lastName || !phone || !email || !password) {
      showToast({
        message: "All fields are required",
        variant: "error",
        duration: 3000,
      });
      return;
    }

    if (password !== confirmPassword) {
      showToast({
        message: "Passwords do not match",
        variant: "error",
        duration: 3000,
      });
      return;
    }

    try {
      await dispatch(signup(formData)).unwrap();
      router.push("/validation");
    } catch (errMessage) {
      showToast({
        message: errMessage || "Signup failed",
        variant: "error",
        duration: 3000,
      });
    }
  };

  // quick tester
  const handleTest = () => {
    showToast({
      message: "Testing toast",
      variant: "error",
      duration: 3000,
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 px-2 justify-center items-center mt-4">
            <ScrollView contentContainerStyle={{paddingBottom: 30}} showsVerticalScrollIndicator={false}>
              {/* Centered content */}
              <View className="w-full">
                <Text className="text-3xl  font-GeneralSansSemiBold text-black mb-1">
                  Create an account
                </Text>
                <Text className=" mb-7 text-black text-lg font-Satoshi">
                  Find your perfect match with just a few steps sign up now and
                  join the millions of people finding love on Bondify
                </Text>

                {/* Inputs */}
                <View>
                  <GlobalPhoneInput
                    value={formData.phone}
                    onChangePhone={(phone) => handleChange("phone", phone)}
                    onChangeCountry={(country) =>
                      console.log("Selected country:", country)
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
                    value={formData.email}
                    onChangeText={(text) => handleChange("email", text)}
                  />
                  <TextInput
                    placeholder="Create your password"
                    secureTextEntry
                    value={formData.password}
                    onChangeText={(text) => handleChange("password", text)}
                  />
                  
                  {/* Button at bottom */}
                  <View className="w-full items-end mt-4">
                    <Button
                      title="Create Account"
                      variant="gradient"
                      loading={loading}
                      onPress={handleSignup}
                    />
                  </View>
              
                </View>
                    {/* Already have account */}
                  <View className="flex-row justify-center items-center gap-1 mt-2">
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
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Register;
