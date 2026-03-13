/**
 * app/(auth)/(onboarding)/verification/_layout.jsx
 * Layout for verification flow - acts as a stack navigator
 */

import { Stack } from "expo-router";

export default function VerificationLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
        gestureEnabled: false,
      }}
    >
      <Stack.Screen 
        name="intro" 
        options={{
          animationTypeForReplace: "pop",
        }}
      />
      <Stack.Screen 
        name="camera"
        options={{
          animationTypeForReplace: "fade",
        }}
      />
      <Stack.Screen 
        name="preview"
        options={{
          animationTypeForReplace: "fade",
        }}
      />
      <Stack.Screen 
        name="done"
        options={{
          animationTypeForReplace: "fade",
        }}
      />
    </Stack>
  );
}
