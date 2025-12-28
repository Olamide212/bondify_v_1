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
import TextInput from "../../../components/inputs/TextInput";
import Button from "../../../components/ui/Button";

const EmailLogin = () => {
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLogin = () => {
    // TODO: dispatch login action
    console.log(formData);
    router.push("/root-tabs");
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

              
            </View>

            <View className="w-full items-end pb-6">
              <Button title="Login" variant="gradient" onPress={handleLogin} />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default EmailLogin;
