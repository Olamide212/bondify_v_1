import { View, Text, ActivityIndicator } from 'react-native'
import React from 'react'
import { colors } from '../../constant/colors'

const ActivityLoader = () => {
  return (
    <View className='w-full h-full bg-white'>
      <ActivityIndicator color={colors.primary} size="large" style={{ flex: 1, justifyContent: "center", alignItems: "center" }} />
    </View>
  )
}

export default ActivityLoader