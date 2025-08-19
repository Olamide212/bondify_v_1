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

const PhoneLogin = () => {
  const [useEmail, setUseEmail] = useState(false);
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 px-2">
            <View className="flex-1 mt-8">
              <Text className="text-4xl font-SatoshiBold text-black ">
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
                <Text className="text-right font-SatoshiMedium text-primary">
                  Forgot Password ?
                </Text>
              </Pressable>
            </View>

            <View className="w-full items-end pb-6">
              <NextButton
                variant="gradient"
                onPress={() => router.push("/validation")}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default PhoneLogin;
