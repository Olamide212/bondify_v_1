import { View, Text } from 'react-native'
import React from 'react'
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

const CommentButton = () => {
  return (
    <View className='w-12 h-12 bg-white/70 rounded-full flex-row justify-center items-center'>
      <MaterialCommunityIcons
        name="comment-text-multiple-outline"
        size={20}
        color="black"
      />
    </View>
  );
}

export default CommentButton