import { View, Text } from 'react-native'
import React from 'react'
import { Stack } from 'expo-router'

const _layouts = () => {
  return (
      <Stack screenOptions={{headerShown: false}}>
      <Stack.Screen name='community-detail' />
      <Stack.Screen name='topic' />
      <Stack.Screen name='post' />
      <Stack.Screen name='create-post' />
      </Stack>
  )
}

export default _layouts