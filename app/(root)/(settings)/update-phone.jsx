/**
 * app/update-phone.jsx
 * Dedicated screen for updating phone number with OTP verification.
 */

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../../constant/colors";
import SettingsService from "../../../services/settingsService";

const UpdatePhoneScreen = () => {
  const router = useRouter();

  const [step, setStep]               = useState("phone"); // "phone" | "otp"
  const [countryCode, setCountryCode] = useState("+234");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp]                 = useState("");
  const [loading, setLoading]         = useState(false);

  // ── Step 1: send OTP to new number ───────────────────────────
  const handleSendOtp = async () => {
    if (!phoneNumber.trim())
      return Alert.alert("Required", "Please enter your new phone number.");

    setLoading(true);
    try {
      await SettingsService.updatePhoneNumber({
        phoneNumber: phoneNumber.trim(),
        countryCode,
      });
      setStep("otp");
    } catch (err) {
      Alert.alert(
        "Error",
        err?.response?.data?.message || err?.message || "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: verify OTP ────────────────────────────────────────
  const handleVerifyOtp = async () => {
    if (otp.trim().length < 4)
      return Alert.alert("Required", "Please enter the OTP sent to your number.");

    setLoading(true);
    try {
      await SettingsService.verifyPhoneUpdate({ otp: otp.trim() });
      Alert.alert("Done!", "Your phone number has been updated.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert(
        "Invalid OTP",
        err?.response?.data?.message || err?.message || "Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* ── Header ── */}
        <View className="flex-row items-center px-5 py-4 border-b border-gray-100">
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="arrow-back" size={24} color="#111" />
          </TouchableOpacity>
          <Text className="flex-1 text-center text-xl font-PlusJakartaSansMedium text-gray-900">
            {step === "phone" ? "Update Phone Number" : "Verify Number"}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <View className="flex-1 px-6 pt-8">

          {step === "phone" ? (
            <>
              {/* ── Phone input step ── */}
              <Text className="text-2xl font-PlusJakartaSansBold text-gray-900 mb-2">
                New phone number
              </Text>
              <Text className="text-base font-PlusJakartaSans text-gray-500 mb-8 leading-6">
                We&apos;ll send a one-time code to verify your new number.
              </Text>

              {/* Country code + number row */}
              <View className="flex-row gap-3 mb-6">
                <TextInput
                  className="w-20 border border-gray-200 rounded-xl px-3 py-4 text-base font-PlusJakartaSans text-gray-900 text-center"
                  value={countryCode}
                  onChangeText={setCountryCode}
                  keyboardType="phone-pad"
                  maxLength={5}
                />
                <TextInput
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-4 text-base font-PlusJakartaSans text-gray-900"
                  placeholder="08012345678"
                  placeholderTextColor="#bbb"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                />
              </View>

              <TouchableOpacity
                className="bg-primary rounded-2xl py-4 items-center"
                onPress={handleSendOtp}
                disabled={loading}
                style={{ backgroundColor: colors.primary }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white text-lg font-PlusJakartaSansBold">
                    Send OTP
                  </Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* ── OTP verification step ── */}
              <Text className="text-2xl font-PlusJakartaSansBold text-gray-900 mb-2">
                Enter the code
              </Text>
              <Text className="text-base font-PlusJakartaSans text-gray-500 mb-8 leading-6">
                We sent a code to{" "}
                <Text className="font-PlusJakartaSansMedium text-gray-800">
                  {countryCode}
                  {phoneNumber}
                </Text>
              </Text>

              <TextInput
                className="border border-gray-200 rounded-xl px-4 py-4 text-3xl font-PlusJakartaSansBold text-gray-900 text-center tracking-widest mb-6"
                placeholder="- - - - - -"
                placeholderTextColor="#ccc"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
              />

              <TouchableOpacity
                className="rounded-2xl py-4 items-center mb-4"
                onPress={handleVerifyOtp}
                disabled={loading}
                style={{ backgroundColor: colors.primary }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white text-lg font-PlusJakartaSansBold">
                    Confirm
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                className="items-center py-2"
                onPress={() => {
                  setOtp("");
                  setStep("phone");
                }}
              >
                <Text
                  className="text-base font-PlusJakartaSansMedium"
                  style={{ color: colors.primary }}
                >
                  ← Change number
                </Text>
              </TouchableOpacity>

              {/* Resend OTP */}
              <TouchableOpacity
                className="items-center py-2 mt-1"
                onPress={handleSendOtp}
                disabled={loading}
              >
                <Text className="text-base font-PlusJakartaSans text-gray-400">
                  Didn&apos;t receive it?{" "}
                  <Text
                    className="font-PlusJakartaSansMedium"
                    style={{ color: colors.primary }}
                  >
                    Resend
                  </Text>
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default UpdatePhoneScreen;
