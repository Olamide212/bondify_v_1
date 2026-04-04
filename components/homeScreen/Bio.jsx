import { View, Text } from 'react-native'
import React, { useState } from 'react'


const Bio = ({ profile }) => {
    
  const [showFullBio, setShowFullBio] = useState(false);



  const isBioLong = profile.bio?.length > MAX_BIO_LENGTH;
  const displayedBio = showFullBio
    ? profile.bio
    : profile.bio?.slice(0, MAX_BIO_LENGTH) + (isBioLong ? "..." : "");

  return (
  <View className="bg-[#121212]/5 border-[0.5px] border-gray-800 mb-5 p-6 rounded-2xl">
          {/* Bio with toggle */}
          {profile.bio && (
            <View className="mb-4">
              <Text className="text-lg font-OutfitBold text-white mb-3">
                About me
              </Text>
              <Text className="text-white font-Outfit text-base">
                {displayedBio}
              </Text>
              {isBioLong && (
                <TouchableOpacity onPress={() => setShowFullBio(!showFullBio)}>
                  <Text className="text-primary mt-1 font-medium">
                    {showFullBio ? "Show less" : "Read more"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
  )
}

export default Bio