import { Stack } from 'expo-router'

export default function DiscoverLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="circle" />
      <Stack.Screen name="discover-profile" />
      <Stack.Screen name="hangouts" />
      <Stack.Screen name="map" />
      <Stack.Screen name="moments" />
      <Stack.Screen name="polls" />
      <Stack.Screen name="profiles" />
    </Stack>
  );
}