import { View, Text } from 'react-native'
import React from 'react'

const ProfileCard = ({profile, title, subTitle, name}) => {
  return (
   <View className="px-6 py-4 bg-white mx-4 rounded-2xl">
      <Text className="mb-2 font-SatoshiMedium text-lg text-gray-500">Basic Bio</Text>
      <View className="flex-row items-center mb-1">
        <Text className="text-black text-3xl font-SatoshiBold">
          {name}
        </Text>
      </View>
      <View className="flex-row items-center mb-1">
        <Text>
          {profile.gender}, {profile.age} years old
        </Text>
      </View>
    </View>
  )
}

export default ProfileCard