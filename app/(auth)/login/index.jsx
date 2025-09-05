import React, { useState } from "react";
import {
  SafeAreaView,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  TouchableOpacity,
  Pressable,
} from "react-native";
import GlobalPhoneInput from "../../../components/inputs/PhoneInput";
import NextButton from "../../../components/ui/NextButton";
import { useRouter } from "expo-router";
import TextInput from "../../../components/inputs/TextInput";
import Button from "../../../components/ui/Button";

const PhoneLogin = () => {
  const [useEmail, setUseEmail] = useState(false);
  const router = useRouter();

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
              <Text className="text-4xl font-GeneralSansSemiBold text-black ">
                Welcome back!
              </Text>
              <Text className="mb-5 text-black text-lg font-Satoshi">
                Login into your Bondify account
              </Text>

              <GlobalPhoneInput
                onChangePhone={(phone) => console.log(phone)}
                onChangeCountry={(country) => console.log(country)}
              />

              <TextInput placeholder="Enter your password" secureTextEntry />
              <Pressable onPress={() => router.push("/forgot-password")}>
                <Text className="text-right font-GeneralSansMedium text-lg text-primary">
                  Forgot Password?
                </Text>
              </Pressable>
            </View>

            <View className="w-full items-end pb-6">
              <Button
                title="Login"
                variant="gradient"
                onPress={() => router.push("/root-tabs")}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default PhoneLogin;
