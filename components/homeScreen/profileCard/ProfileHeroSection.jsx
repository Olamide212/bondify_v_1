/**
 * ProfileHeroSection.jsx
 */

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { Briefcase, Eye, Globe, Heart, Info, MapPin, Users } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { colors } from '../../../constant/colors';
import VerifiedIcon from '../../ui/VerifiedIcon';

const extractVoicePromptUri = (voicePrompt) => {
  if (!voicePrompt) return null;
  if (typeof voicePrompt === 'string' && voicePrompt.trim()) return voicePrompt.trim();
  if (typeof voicePrompt === 'object')
    return voicePrompt.url || voicePrompt.uri || voicePrompt.secure_url || null;
  return null;
};


const formatLocation = (location) => {
  if (!location) return null;
  if (typeof location === 'string' && location.trim()) return location.trim();
  if (typeof location === 'object') {
    const parts = [location.city, location.state, location.country].filter(
      (v) => typeof v === 'string' && v.trim()
    );
    return parts.length > 0 ? parts.join(', ') : null;
  }
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
   const locationText = formatLocation(profile.location);
  const nationalityText = profile.nationality ? String(profile.nationality).trim() : null;
  const occupationText = profile.occupation ? String(profile.occupation).trim() : null;
  const religionText = profile.religion ? String
    (profile.religion).trim() : null;
    const ethnicityText = profile.ethnicity ? String(profile.ethnicity).trim() : null;
     const verified = profile?.verificationStatus === "approved";

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
        className="shadow-lg overflow-hidden bg-[#121212]"
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
              blurRadius={profile?.blurPhotos ? 25 : 0}
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

            {/* Blur badge overlay */}
            {profile?.blurPhotos && (
              <View style={heroStyles.blurBadge}>
                <Eye size={16} color="#fff" />
                <Text style={heroStyles.blurBadgeText}>Photos are blurred</Text>
              </View>
            )}

            <View className="absolute bottom-48 left-6 right-6">
              <View className="flex-row items-center gap-2 mb-3">
{/* Compatibility Score & Likes You Badges */}
                  {compatibilityScore !== null && !loadingScore && (
                    <View className="flex-row items-center bg-pinkColor px-3 py-1 rounded-full">
                      <Heart size={14} color="#fff" fill="#fff" />
                      <Text className="text-white text-sm font-OutfitBold ml-1">
                        {compatibilityScore}%
                      </Text>
                    </View>
                  )}
                  {likesYou && (
                    <View className="flex-row items-center bg-rose-500 px-3 py-1 rounded-full">
                      <Heart size={14} color="#fff" fill="#fff" />
                      <Text className="text-white text-sm font-OutfitBold ml-1">
                        Likes You
                      </Text>
                    </View>
                  )}
              </View>
  


              {/* Name + age + compatibility score */}
              <View className="flex-row items-center mb-3">
                <Text className="text-white text-4xl font-OutfitBold mr-2 capitalize" numberOfLines={1}>
                  {displayName}
                </Text>
                <View className="flex-row items-center gap-2">
                  <Text className="text-white text-4xl font-Outfit">{profile.age}</Text>
                {verified &&
                                 <View style={{ marginLeft: 6 }}><VerifiedIcon /></View>
                               }
                  
                
                </View>
              </View>

              {/* Voice prompt */}
              {/* {voicePromptUri ? (
                <View style={{ marginBottom: 14 }}>
                  <VoicePromptButton uri={voicePromptUri} />
                </View>
              ) : null} */}

              {/* Chips */}
            <View className='flex-row flex-wrap items-center gap-2 mt-3'>
             
              {occupationText ? (
                <View className='px-6 py-2 flex-row items-center justify-center gap-1 bg-black/40 rounded-lg' >
                  <Briefcase size={16} color={colors.white} />
                  <Text className='capitalize text-white font-OutfitMedium'> {occupationText}</Text>
                </View>
              ) : null}

           
              {nationalityText ? (
                <View className='px-6 py-2 flex-row items-center justify-center gap-1 bg-black/40 rounded-lg' >
                  <Globe size={16} color={colors.white} />
                  <Text className='capitalize text-white font-OutfitMedium'> {nationalityText}</Text>
                </View>
              ) : null}

          
              {ethnicityText ? (
                <View className='px-6 py-2 flex-row items-center justify-center gap-1 bg-black/40 rounded-lg' >
                  <Users size={16} color={colors.white} />
                  <Text className='capitalize text-white font-OutfitMedium'> {ethnicityText}</Text>
                </View>
              ) : null}

         
              {religionText ? (
                <View className='px-6 py-2 flex-row items-center justify-center gap-1 bg-black/40 rounded-lg' >
                  <MaterialCommunityIcons name="hands-pray" size={20} color={colors.white} />
                  <Text className='capitalize text-white font-OutfitMedium'> {religionText}</Text>
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

const heroStyles = StyleSheet.create({
  blurBadge: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    zIndex: 30,
  },
  blurBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'OutfitSemiBold',
  },
});

export default ProfileHeroSection;