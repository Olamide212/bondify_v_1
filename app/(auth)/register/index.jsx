import React from "react";
import {
  SafeAreaView,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import GlobalPhoneInput from "../../../components/inputs/PhoneInput";
import NextButton from "../../../components/ui/NextButton";
import { useRouter } from "expo-router";
import TextInput from "../../../components/inputs/TextInput"

const Register = () => {
  

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
              <Text className="text-3xl textt-center font-SatoshiBold text-black mb-2">
                Create an account
              </Text>
              <Text className="text-center mb-7 text-black text-lg font-Satoshi">
                Find your perfect match with just a few steps sign up now and
                join the millions of people finding love on Bondify
              </Text>
              <View className="">
                <GlobalPhoneInput
                  onChangePhone={(phone) => console.log(phone)}
                  onChangeCountry={(country) => console.log(country)}
                />
                <TextInput
                  placeholder="First name"
                  className=""
                />
                <TextInput
                  placeholder="Last name"
                  className=""
                />
                <TextInput
                  placeholder="Enter your email address"
                  className=""
                />
                <TextInput placeholder="Create your password" secureTextEntry />
              
              </View>
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

export default Register;
