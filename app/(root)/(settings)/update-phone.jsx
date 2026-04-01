/**
 * app/update-phone.jsx
 * Dedicated screen for updating phone number with OTP verification.
 */

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import GlobalPhoneInput from "../../../components/inputs/PhoneInput";
import { colors } from "../../../constant/colors";
import { useAlert } from "../../../context/AlertContext";
import SettingsService from "../../../services/settingsService";

const UpdatePhoneScreen = () => {
  const router = useRouter();
  const { showAlert } = useAlert();

  const [step, setStep]               = useState("phone"); // "phone" | "otp"
  const [countryCode, setCountryCode] = useState("+234");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp]                 = useState("");
  const [loading, setLoading]         = useState(false);

  // ── Step 1: send OTP to new number ───────────────────────────
  const handleSendOtp = async () => {
    if (!phoneNumber.trim())
      return showAlert({
        icon: 'warning',
        title: 'Required',
        message: 'Please enter your new phone number.',
        actions: [{ label: 'OK', style: 'primary' }],
      });

    setLoading(true);
    try {
      await SettingsService.updatePhoneNumber({
        phoneNumber: phoneNumber.trim(),
        countryCode,
      });
      setStep("otp");
    } catch (err) {
      showAlert({
        icon: 'error',
        title: 'Error',
        message: err?.response?.data?.message || err?.message || 'Something went wrong.',
        actions: [{ label: 'OK', style: 'primary' }],
      });
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: verify OTP ────────────────────────────────────────
  const handleVerifyOtp = async () => {
    if (otp.trim().length < 4)
      return showAlert({
        icon: 'warning',
        title: 'Required',
        message: 'Please enter the OTP sent to your number.',
        actions: [{ label: 'OK', style: 'primary' }],
      });

    setLoading(true);
    try {
      await SettingsService.verifyPhoneUpdate({ otp: otp.trim() });
      showAlert({
        icon: 'success',
        title: 'Done!',
        message: 'Your phone number has been updated.',
        actions: [{ label: 'OK', style: 'primary', onPress: () => router.back() }],
      });
    } catch (err) {
      showAlert({
        icon: 'error',
        title: 'Invalid OTP',
        message: err?.response?.data?.message || err?.message || 'Please try again.',
        actions: [{ label: 'OK', style: 'primary' }],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{flex: 1}} className="bg-white" edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* ── Header ── */}
        <View className="flex-row items-center px-5 py-4 border-b border-gray-100">
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="arrow-back" size={24} color="#111" />
          </TouchableOpacity>
          <Text style={{flex: 1}} className="text-center text-xl font-PlusJakartaSansMedium text-gray-900">
            {step === "phone" ? "Update Phone Number" : "Verify Number"}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={{flex: 1}} className="px-6 ">

          {step === "phone" ? (
            <>
              {/* ── Phone input step ── */}
              <Text className="text-2xl font-PlusJakartaSansBold text-gray-900 mb-2">
                New phone number
              </Text>
              <Text className="text-base font-PlusJakartaSans text-gray-500 mb-8 leading-6">
                We&apos;ll send a one-time code to your email to verify the phone number update.
              </Text>

              {/* Phone input */}
              <View className="mb-6">
                <GlobalPhoneInput
                  phoneNumber={phoneNumber}
                  countryCode={countryCode}
                  onChangePhoneNumber={setPhoneNumber}
                  onChangeCountryCode={setCountryCode}
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
                We sent a verification code to your email to confirm the phone number change to{" "}
                <Text className="font-PlusJakartaSansMedium text-gray-800">
                  {countryCode}{phoneNumber}
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
