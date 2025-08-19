import { Stack } from "expo-router";

export default function _layout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tab)" />
      <Stack.Screen name="splash-screen" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="welcome" />

      <Stack.Screen
        name="filter"
        options={{
          presentation: "modal", // Native modal style
          animation: "slide_from_bottom", // iOS-style slide up
          gestureDirection: "vertical", // Swipe down to close
          headerShown: false,
        }}
      />
    </Stack>
  );
}
