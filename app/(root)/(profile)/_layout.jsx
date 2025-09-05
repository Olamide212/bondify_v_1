import { View, Text } from 'react-native'
import React from 'react'
import { Stack } from 'expo-router'


export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="profile-details/index"
      />
      <Stack.Screen
        name="profile-detail/index"
      />
      <Stack.Screen
        name="profiles/index"
      />
      <Stack.Screen
        name="badges"
      />
      <Stack.Screen name="nationality/index" />
      <Stack.Screen name="index" />
    </Stack>
  );
}