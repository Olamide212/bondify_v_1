/**
 * ProfileHeroSection.jsx
 */

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { Briefcase, Heart, MapPin } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { colors } from '../../../constant/colors';
import VerifiedIcon from '../../ui/VerifiedIcon';
import VoicePromptButton from '../../ui/VoicepromptButton';

const extractVoicePromptUri = (voicePrompt) => {
  if (!voicePrompt) return null;
  if (typeof voicePrompt === 'string' && voicePrompt.trim()) return voicePrompt.trim();
  if (typeof voicePrompt === 'object')
    return voicePrompt.url || voicePrompt.uri || voicePrompt.secure_url || null;
  return null;
};

const ProfileHeroSection = ({
  profile,
  currentImageIndex,
  getImageUri,
  openImageModal,
  handleImageLayout,
  isImageCacheHydrated,
  isUriCached,
  onMarkUriLoaded,
  compatibilityScore,
  loadingScore,
  likesYou = false,
}) => {
  const [mainImageLoading, setMainImageLoading] = useState(false);

  const voicePromptUri = extractVoicePromptUri("https://bondies-s3-user.s3.us-east-1.amazonaws.com/bondies/voice_prompts/69b61304986a1fb823cc0573/1774149746551-737873612.m4a");

  const locationLabel = [profile?.distance, profile?.location]
    .filter((v) => v && typeof v === 'string' && v.trim())
    .join(', ');

  useEffect(() => {
    const uri = getImageUri(currentImageIndex);
    setMainImageLoading(Boolean(uri) && isImageCacheHydrated && !isUriCached(uri));
  }, [currentImageIndex, getImageUri, isImageCacheHydrated, isUriCached]);

  const displayName = (() => {
    const parts = String(profile?.name || '').trim().split(/\s+/).filter(Boolean);
    return parts.length === 0 ? 'Unknown' : `${parts[0]} `;
  })();

  return (
    <Pressable onPress={() => openImageModal(currentImageIndex)}>
      <View
        onLayout={(event) => handleImageLayout(0, event)}
        className="shadow-lg overflow-hidden bg-white"
        style={{ width: '100%', height: 820 }}
      >
        <TouchableWithoutFeedback onPress={() => openImageModal(currentImageIndex)}>
          <View className="relative w-full">
            <Image
              source={{ uri: getImageUri(currentImageIndex) }}
              className="w-full h-full"
              contentFit="cover"
              cachePolicy="memory-disk"
              style={{ width: '100%', height: 950 }}
              onLoadStart={() => {
                const uri = getImageUri(currentImageIndex);
                if (isImageCacheHydrated && !isUriCached(uri)) setMainImageLoading(true);
              }}
              onLoad={async () => {
                await onMarkUriLoaded(getImageUri(currentImageIndex));
                setMainImageLoading(false);
              }}
              onError={() => setMainImageLoading(false)}
            />

            {mainImageLoading && (
              <View className="absolute inset-0 items-center justify-center">
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            )}

            <View className="absolute bottom-64 left-6 right-6">
              <View className="flex-row items-center gap-2 mb-3">
{/* Compatibility Score & Likes You Badges */}
                  {compatibilityScore !== null && !loadingScore && (
                    <View className="flex-row items-center bg-pinkColor px-3 py-1 rounded-full">
                      <Heart size={14} color="#fff" fill="#fff" />
                      <Text className="text-white text-sm font-PlusJakartaSansBold ml-1">
                        {compatibilityScore}%
                      </Text>
                    </View>
                  )}
                  {likesYou && (
                    <View className="flex-row items-center bg-rose-500 px-3 py-1 rounded-full">
                      <Heart size={14} color="#fff" fill="#fff" />
                      <Text className="text-white text-sm font-PlusJakartaSansBold ml-1">
                        Likes You
                      </Text>
                    </View>
                  )}
              </View>
  


              {/* Name + age + compatibility score */}
              <View className="flex-row items-center mb-3">
                <Text className="text-white text-4xl font-PlusJakartaSansBold mr-2 capitalize" numberOfLines={1}>
                  {displayName}
                </Text>
                <View className="flex-row items-center gap-2">
                  <Text className="text-white text-4xl font-PlusJakartaSans">{profile.age}</Text>
                  {(profile.verified || profile.isVerified) && <VerifiedIcon />}
                  
                
                </View>
              </View>

              {/* Voice prompt */}
              {voicePromptUri ? (
                <View style={{ marginBottom: 14 }}>
                  <VoicePromptButton uri={voicePromptUri} />
                </View>
              ) : null}

              {/* Chips */}
              <View className="flex-row items-center flex-wrap gap-x-4 gap-y-4">
                {profile.occupation && (
                  <View className="flex-row items-center bg-white px-4 py-2 rounded-full">
                    <Briefcase size={18} color="#000" />
                    <Text className="text-black font-PlusJakartaSansSemiBold ml-2 capitalize">
                      {profile.occupation}
                    </Text>
                  </View>
                )}
                {profile.religion && (
                  <View className="flex-row items-center bg-secondary px-4 py-2 rounded-full">
                    <MaterialCommunityIcons name="hands-pray" size={20} color="#fff" />
                    <Text className="text-white font-PlusJakartaSansSemiBold ml-2 capitalize">
                      {profile.religion}
                    </Text>
                  </View>
                )}
                {locationLabel ? (
                  <View className="flex-row items-center bg-white px-4 py-2 rounded-full">
                    <MapPin size={18} color="#000" />
                    <Text className="text-black font-PlusJakartaSansSemiBold ml-2">
                      {locationLabel}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </Pressable>
  );
};

export default ProfileHeroSection;