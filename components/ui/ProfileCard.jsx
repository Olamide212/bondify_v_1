import { View, Text } from 'react-native'
import React from 'react'

const ProfileCard = ({profile, title, subTitle, name}) => {
  return (
   <View className="px-6 py-4 bg-[#121212] mx-4 rounded-2xl">
      <Text className="mb-2 font-OutfitMedium text-lg text-gray-400">Basic Bio</Text>
      <View className="flex-row items-center mb-1">
        <Text className="text-white text-3xl font-OutfitBold">
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