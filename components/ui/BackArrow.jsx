import { View, Text, Pressable } from 'react-native'
import React from 'react'
import { useRouter } from 'expo-router'
import { ArrowLeft } from "lucide-react-native";

const BackArrow = () => {
  const router = useRouter()

  return (
    <Pressable onPress={() => router.back()}>
      <View>
        <ArrowLeft />
      </View>
    </Pressable>
  );
}

export default BackArrow