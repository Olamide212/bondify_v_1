import { View, Text } from 'react-native'
import React from 'react'

const TextHeadingOne = ({name}) => {
  return (
    <View>
      <Text className="text-[16px] font-SatoshiMedium text-black mt-4 mx-4">
                {name}
              </Text>
    </View>
  )
}

export default TextHeadingOne