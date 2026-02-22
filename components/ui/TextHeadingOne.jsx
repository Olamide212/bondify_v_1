import { Text, View } from 'react-native'
import { colors } from '../../constant/colors'

const TextHeadingOne = ({ name, icon: Icon }) => {
  return (
    <View className="flex-row items-center gap-2 mb-4">
      {Icon ? (
        <View className=" rounded-full center justify-center">
          <Icon size={20} color={colors.primary} className="text-gray-500" />
        </View>
      ) : null}
      <Text className="text-[18px] font-SatoshiMedium text-gray-500">
        {name}
      </Text>
    </View>
  )
}

export default TextHeadingOne