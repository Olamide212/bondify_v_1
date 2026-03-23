import { Stack } from 'expo-router';


export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="InterestsScreen" />
      <Stack.Screen name="badges" />
      <Stack.Screen name="edit-profiles" />
      <Stack.Screen name="events" />
      <Stack.Screen name="invite" />
      <Stack.Screen name="nationality" />
      <Stack.Screen name="subscription" />
      <Stack.Screen name="support-center" />
      <Stack.Screen name="wallet" />
    </Stack>
  );
}