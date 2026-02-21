import { View } from "react-native";
import React from "react";
import { Stack, useSegments } from "expo-router";
import HeaderWithLogo from "../../components/headers/HeaderWithLogo";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AuthLayout() {
  const segments = useSegments(); // returns an array like ['auth', '(onboarding)', 'birthday']

  // Check if user is on an onboarding screen
  const isOnboarding = segments.includes("(onboarding)");
  const isLogin = segments.includes("login");

  return (
    <SafeAreaView className={"flex-1 bg-white px-4"}>
      {!isOnboarding && <HeaderWithLogo showBackButton={!isLogin} />}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="reset-password" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="validation" />
        <Stack.Screen name="(onboarding)" />
      </Stack>
    </SafeAreaView>
  );
}
