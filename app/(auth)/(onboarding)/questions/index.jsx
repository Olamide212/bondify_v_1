import React from 'react'
import { SafeAreaView, Text, View } from 'react-native'

const Questions = () => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#121212' }}>
      <View style={{ flex: 1, backgroundColor: '#121212' }} className="px-4 pt-8">
        <Text className="text-white text-2xl font-PlusJakartaSansBold">Questions</Text>
      </View>
    </SafeAreaView>
  )
}

export default Questions