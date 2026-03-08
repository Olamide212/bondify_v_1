/**
 * app/update-email.jsx
 * Dedicated screen for updating email address with OTP verification.
 */

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
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import SettingsService from "../../../services/settingsService";

const UpdateEmailScreen = () => {
  const router = useRouter();

  const [step, setStep]       = useState("email"); // "email" | "otp"
  const [email, setEmail]     = useState("");
  const [otp, setOtp]         = useState("");
  const [loading, setLoading] = useState(false);

  // ── Step 1: request email change OTP ─────────────────────────
  const handleSendCode = async () => {
    const cleaned = email.trim().toLowerCase();
    if (!cleaned) return Alert.alert("Required", "Please enter your new email address.");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleaned))
      return Alert.alert("Invalid", "Please enter a valid email address.");

    setLoading(true);
    try {
      await SettingsService.updateEmail({ email: cleaned });
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
      return Alert.alert("Required", "Please enter the code we sent to your email.");

    setLoading(true);
    try {
      await SettingsService.verifyEmailUpdate({ otp: otp.trim() });
      Alert.alert("Done!", "Your email address has been updated.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert(
        "Invalid code",
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
            {step === "email" ? "Update Email" : "Verify Email"}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <View className="flex-1 px-6 pt-8">

          {step === "email" ? (
            <>
              {/* ── Email input step ── */}
              <Text className="text-2xl font-PlusJakartaSansBold text-gray-900 mb-2">
                New email address
              </Text>
              <Text className="text-base font-PlusJakartaSans text-gray-500 mb-8 leading-6">
                We&apos;ll send a verification code to confirm your new email.
              </Text>

              <TextInput
                className="border border-gray-200 rounded-xl px-4 py-4 text-base font-PlusJakartaSans text-gray-900 mb-6"
                placeholder="newmail@example.com"
                placeholderTextColor="#bbb"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <TouchableOpacity
                className="rounded-2xl py-4 items-center"
                onPress={handleSendCode}
                disabled={loading}
                style={{ backgroundColor: "#E8521A" }}
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
              <Text className="text-2xl font-PlusJakartaSansBold text-gray-900 mb-2">
                Check your inbox
              </Text>
              <Text className="text-base font-PlusJakartaSans text-gray-500 mb-8 leading-6">
                We sent a code to{" "}
                <Text className="font-PlusJakartaSansMedium text-gray-800">
                  {email}
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
                style={{ backgroundColor: "#E8521A" }}
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
                  style={{ color: "#E8521A" }}
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
                    style={{ color: "#E8521A" }}
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
