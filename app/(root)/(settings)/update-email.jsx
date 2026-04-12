/**
 * app/update-email.jsx
 * Dedicated screen for updating email address with OTP verification.
 */

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TextInput from "../../../components/inputs/TextInput";
import { colors } from "../../../constant/colors";
import { useAlert } from "../../../context/AlertContext";
import SettingsService from "../../../services/settingsService";

const UpdateEmailScreen = () => {
  const router = useRouter();
  const { showAlert } = useAlert();

  const [step, setStep]       = useState("email"); // "email" | "otp"
  const [email, setEmail]     = useState("");
  const [otp, setOtp]         = useState("");
  const [loading, setLoading] = useState(false);

  // ── Step 1: request email change OTP ─────────────────────────
  const handleSendCode = async () => {
    const cleaned = email.trim().toLowerCase();
    if (!cleaned) return showAlert({
      icon: 'warning',
      title: 'Required',
      message: 'Please enter your new email address.',
      actions: [{ label: 'OK', style: 'primary' }],
    });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleaned))
      return showAlert({
        icon: 'warning',
        title: 'Invalid',
        message: 'Please enter a valid email address.',
        actions: [{ label: 'OK', style: 'primary' }],
      });

    setLoading(true);
    try {
      await SettingsService.updateEmail({ email: cleaned });
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
        message: 'Please enter the code we sent to your email.',
        actions: [{ label: 'OK', style: 'primary' }],
      });

    setLoading(true);
    try {
      await SettingsService.verifyEmailUpdate({ otp: otp.trim() });
      showAlert({
        icon: 'success',
        title: 'Done!',
        message: 'Your email address has been updated.',
        actions: [{ label: 'OK', style: 'primary', onPress: () => router.back() }],
      });
    } catch (err) {
      showAlert({
        icon: 'error',
        title: 'Invalid code',
        message: err?.response?.data?.message || err?.message || 'Please try again.',
        actions: [{ label: 'OK', style: 'primary' }],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{flex: 1}} className="bg-[#121212]" edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* ── Header ── */}
        <View className="flex-row items-center px-5 py-4 ">
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={{flex: 1}} className="text-center text-xl font-PlusJakartaSansMedium text-white">
            {step === "email" ? "Update Email" : "Verify Email"}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={{flex: 1}} className="px-6 pt-8">

          {step === "email" ? (
            <>
              {/* ── Email input step ── */}
              <Text className="text-2xl font-PlusJakartaSansBold text-white mb-2">
                New email address
              </Text>
              <Text className="text-base font-PlusJakartaSans text-white mb-8 leading-6">
                We&apos;ll send a verification code to confirm your new email.
              </Text>

              <TextInput
                placeholder="newmail@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
              />

              <TouchableOpacity
                className="rounded-2xl py-4 items-center"
                onPress={handleSendCode}
                disabled={loading}
                style={{ backgroundColor: colors.primary }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white text-lg font-PlusJakartaSansBold">
                    Send Code
                  </Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* ── OTP verification step ── */}
              <Text className="text-2xl font-PlusJakartaSansBold text-gray-100 mb-2">
                Check your inbox
              </Text>
              <Text className="text-base font-PlusJakartaSans text-gray-400 mb-8 leading-6">
                We sent a code to{" "}
                <Text className="font-PlusJakartaSansMedium text-gray-200">
                  {email}
                </Text>
              </Text>

              <TextInput
                placeholder="Enter verification code"
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
                  setStep("email");
                }}
              >
                <Text
                  className="text-base font-PlusJakartaSansMedium"
                  style={{ color: colors.primary }}
                >
                  ← Change email
                </Text>
              </TouchableOpacity>

              {/* Resend code */}
              <TouchableOpacity
                className="items-center py-2 mt-1"
                onPress={handleSendCode}
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

export default UpdateEmailScreen;
