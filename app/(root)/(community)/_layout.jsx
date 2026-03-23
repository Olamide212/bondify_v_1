import { Stack } from 'expo-router'

export default function CommunityLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="community-detail" />
      <Stack.Screen name="topic" />
      <Stack.Screen name="post" />
      <Stack.Screen name="create-post" />
    </Stack>
  )
}