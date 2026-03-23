import { Stack } from 'expo-router'

export default function SettingsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="settings" />
      <Stack.Screen name="blocked-users" />
      <Stack.Screen name="change-password" />
      <Stack.Screen name="community-guidelines" />
      <Stack.Screen name="cookie-policy" />
      <Stack.Screen name="faq" />
      <Stack.Screen name="notification-settings" />
      <Stack.Screen name="privacy-policy" />
      <Stack.Screen name="privacy-settings" />
      <Stack.Screen name="report-a-problem" />
      <Stack.Screen name="terms-of-services" />
      <Stack.Screen name="theme-settings" />
      <Stack.Screen name="update-email" />
      <Stack.Screen name="update-phone" />
    </Stack>
  )
}