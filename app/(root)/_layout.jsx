import { Stack } from "expo-router";

export default function _layout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tab)" />
      <Stack.Screen name="splash-screen" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="welcome" />
      <Stack.Screen name="(profile)" />
      <Stack.Screen name="(discover)" />
      <Stack.Screen name="user-profile"  />
      <Stack.Screen name="(settings)" />

      <Stack.Screen
        name="filter"
        options={{
          presentation: "modal", 
          animation: "slide_from_bottom", 
          gestureDirection: "vertical", 
          headerShown: false,
        }}
      />
    </Stack>
  );
}
