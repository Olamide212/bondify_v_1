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
import GlobalPhoneInput from "../../../components/inputs/PhoneInput";
import { Image } from "expo-image";
import NextButton from "../../../components/ui/NextButton";
import HeaderWithLogo from "../../../components/headers/HeaderWithLogo";
import GlobalOtpInput from "../../../components/inputs/OtpInput";
import { useRouter } from "expo-router";


const Validation = () => {
  const [otp, setOtp] = useState("");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = () => {
    setTouched(true);

    if (!otp || otp.length < 6) {
      setError("Please enter the 6-digit code");
      return;
    }

    // clear error if valid
    setError("");
    Alert.alert("Success", `OTP Submitted: ${otp}`);
    // perform verification or navigate
  };


  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 ">

            <View className="flex-1 px-2 mt-8">
              <Text className="text-3xl font-SatoshiBold text-black">
                Enter verification code
              </Text>
              <Text className="mb-7 text-black text-lg font-Satoshi">
                Please enter verification code sent to your phone number
              </Text>

              <GlobalOtpInput
                onTextChange={setOtp}
                onFocus={() => setTouched(true)}
                touched={touched}
                errors={error}
              />
            </View>

            <View className="w-full items-end px-2 pb-6">
              <NextButton variant="gradient" onPress={() => router.push("/agreement")} />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Validation;
