/**
 * OwnProfileCard.jsx
 *
 * Read-only preview of the current user's own profile.
 * Shown on the "View Profile" tab of the Edit Profile screen.
 *
 * Intentionally omits all interaction widgets:
 *   ✗ Share / Block / Report buttons
 *   ✗ DirectMessageBox
 *   ✗ CommentBox (image comment prompts)
 *   ✗ Follow button
 */

import { Image } from "expo-image";
import { useMemo, useState } from "react";
import {
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { styles as themeStyles } from "../../constant/colors";
import { usePersistentUriCache } from "../../hooks/usePersistentUriCache";
import ProfileHeroSection from "./profileCard/ProfileHeroSection";
import ProfileImageModal from "./profileCard/ProfileImageModal";

const MAX_BIO_LENGTH = 120;
const { width: SW } = Dimensions.get("window");
const FALLBACK_PROFILE_IMAGE =
  "https://via.placeholder.com/800x1200?text=No+Photo";

// ─── Reusable chip ────────────────────────────────────────────────────────────
const Chip = ({ label }) => (
  <View className="rounded-full px-4 py-2 mr-2 mb-2 flex-row items-center gap-1 bg-transparent border border-white">
    <Text className="font-OutfitMedium text-base text-white">{label}</Text>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────

const OwnProfileCard = ({ profile }) => {
  const [showFullBio, setShowFullBio] = useState(false);
  const currentImageIndex = 0;
  const [modalVisible, setModalVisible] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const [, setImageLayouts] = useState({});

  const totalImages = profile?.images?.length || 1;
  const profileImages = useMemo(
    () => (Array.isArray(profile?.images) ? profile.images : []),
    [profile?.images]
  );
  const getImageUri = (index) =>
    profileImages[index] || FALLBACK_PROFILE_IMAGE;

  const { isHydrated: isImageCacheHydrated, isUriCached, touchUri } =
    usePersistentUriCache({
      storageKey: "@bondify/cache/own-profile/imageUris",
      maxSize: 50,
    });

  const openImageModal = (index) => {
    setModalImageIndex(index);
    setModalVisible(true);
  };

  const closeImageModal = () => setModalVisible(false);

  const handleImageLayout = (index, event) => {
    const { y, height: h } = event.nativeEvent.layout;
    setImageLayouts((prev) => ({ ...prev, [index]: { y, height: h } }));
  };

  if (!profile) return null;

  const isBioLong = profile.bio?.length > MAX_BIO_LENGTH;
  const displayedBio = showFullBio
    ? profile.bio
    : profile.bio?.slice(0, MAX_BIO_LENGTH) + (isBioLong ? "..." : "");

  return (
    <View className="relative">
      <ProfileImageModal
        visible={modalVisible}
        onClose={closeImageModal}
        totalImages={totalImages}
        modalImageIndex={modalImageIndex}
        onChangeImageIndex={setModalImageIndex}
        getImageUri={getImageUri}
        isImageCacheHydrated={isImageCacheHydrated}
        isUriCached={isUriCached}
        onMarkUriLoaded={touchUri}
      />

      <Animated.ScrollView
        contentContainerStyle={{ paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <ProfileHeroSection
            profile={profile}
            currentImageIndex={currentImageIndex}
            getImageUri={getImageUri}
            openImageModal={openImageModal}
            handleImageLayout={handleImageLayout}
            isImageCacheHydrated={isImageCacheHydrated}
            isUriCached={isUriCached}
            onMarkUriLoaded={touchUri}
            likesYou={profile?.likesYou ?? false}
          />


                    {/* ── Tagline ── */}
                    <View style={{backgroundColor: '#121212', marginVertical: 20}}>
   {profile?.tagline && (
                      <View className="px-4  rounded-t-2xl" >
                        <Text className="text-3xl text-white italic font-OutfitSemiBold">
                         &quot;{profile.tagline}&quot;
                        </Text>
                      </View>
                    )}
                    </View>
                 

          <View className="py-3">

            {/* ══════════════════════════════════════════════════════
                 LOOKING FOR
               ══════════════════════════════════════════════════════ */}
            {profile.lookingFor && (
              <View className=" p-5 mb-2 mx-2 rounded-2xl " style={themeStyles.boxContainer}>
                <Text className="text-[20px] font-OutfitSemiBold text-primary ml-2 mb-3">
                  Looking For
                </Text>
                <View className="bg-gray-800 rounded-full px-4 py-2 flex-row items-center gap-3 self-start">
                  <Text>💘</Text>
                  <Text className="text-white text-xl font-OutfitMedium">{profile.lookingFor}</Text>
                </View>
              </View>
            )}

            {/* ── Bio ── */}
            {profile.bio && (
              <View className=" p-5 mb-2 mx-2 rounded-2xl " style={themeStyles.boxContainer}>
                <Text className="text-[18px] font-OutfitSemiBold text-primary mb-3">
                  Bio
                </Text>
                <Text className="text-white font-Outfit text-[16px]">
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

            {/* ── Question 1 ── */}
            {profile.questions?.[0] && (
              <View className=" p-5 mb-2 mx-2 rounded-2xl " style={themeStyles.boxContainer}>
                <Text className="text-white font-Outfit text-base">
                  {profile.questions[0].question}
                </Text>
                <Text className="text-white font-OutfitBold text-2xl leading-relaxed capitalize">
                  {profile.questions[0].answer}
                </Text>
              </View>
            )}

            {/* ── Image 2 preview (no comment box) ── */}
            {profileImages[1] && (
              <TouchableOpacity
                onPress={() => openImageModal(1)}
                activeOpacity={0.9}
                style={localStyles.imagePreview}
              >
                <Image
                  source={{ uri: profileImages[1] }}
                  style={localStyles.previewImg}
                  contentFit="cover"
                />
              </TouchableOpacity>
            )}

            {/* ══════════════════════════════════════════════════════
                 BASICS
                 (zodiac, height, religion, nationality, ethnicity, distance)
               ══════════════════════════════════════════════════════ */}
            <View className=" p-5 mb-2 mx-3 rounded-2xl " style={themeStyles.boxContainer}>
              <Text className="text-[20px] font-OutfitSemiBold text-primary ml-2 mb-4">
                Basics
              </Text>
              <View className="flex-row flex-wrap -mx-1.5">
                {profile.zodiac && (
                  <View className="w-1/2 px-1.5 mb-3">
                    <View className="bg-gray-800 rounded-full px-4 py-2 flex-row items-center gap-3">
                      <Text>♉️</Text>
                      <Text className="text-white text-base font-OutfitMedium">{profile.zodiac}</Text>
                    </View>
                  </View>
                )}
                {profile.height && (
                  <View className="w-1/2 px-1.5 mb-3">
                    <View className="bg-gray-800 rounded-full px-4 py-2 flex-row items-center gap-3">
                      <Text>📏</Text>
                      <Text className="text-white text-base font-OutfitMedium">{profile.height}cm</Text>
                    </View>
                  </View>
                )}
                {profile.religion && (
                  <View className="w-1/2 px-1.5 mb-3">
                    <View className="bg-gray-800 rounded-full px-4 py-2 flex-row items-center gap-3">
                      <Text>🙏</Text>
                      <Text className="text-white text-base font-OutfitMedium">{profile.religion}</Text>
                    </View>
                  </View>
                )}
                {profile.nationality && (
                  <View className="w-1/2 px-1.5 mb-3">
                    <View className="bg-gray-800 rounded-full px-4 py-2 flex-row items-center gap-3">
                      <Text>🌍</Text>
                      <Text className="text-white text-base capitalize font-OutfitMedium">{profile.nationality}</Text>
                    </View>
                  </View>
                )}
                {profile.ethnicity && (
                  <View className="w-1/2 px-1.5 mb-3">
                    <View className="bg-gray-800 rounded-full px-4 py-2 flex-row items-center gap-3">
                      <Text>👤</Text>
                      <Text className="text-white text-base capitalize font-OutfitMedium">{profile.ethnicity}</Text>
                    </View>
                  </View>
                )}
                {profile.distance && (
                  <View className="w-1/2 px-1.5 mb-3">
                    <View className="bg-gray-800 rounded-full px-4 py-2 flex-row items-center gap-3">
                      <Text>📍</Text>
                      <Text className="text-white text-base font-OutfitMedium">{profile.distance}</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* ══════════════════════════════════════════════════════
                 LIFESTYLE
                 (drinking, smoking, exercise, pets, children)
               ══════════════════════════════════════════════════════ */}
            {(profile.drinking || profile.smoking || profile.exercise || profile.pets || profile.children) && (
              <View className=" p-5 mb-2 mx-3 rounded-2xl " style={themeStyles.boxContainer}>
                <Text className="text-[20px] font-OutfitSemiBold text-primary ml-2 mb-4">
                  Lifestyle
                </Text>
                <View className="flex-row flex-wrap -mx-1.5">
                  {profile.drinking && (
                    <View className="w-1/2 px-1.5 mb-3">
                      <View className="bg-gray-800 rounded-full px-4 py-2 flex-row items-center gap-3">
                        <Text>🍷</Text>
                        <Text className="text-white text-base font-OutfitMedium">{profile.drinking}</Text>
                      </View>
                    </View>
                  )}
                  {profile.smoking && (
                    <View className="w-1/2 px-1.5 mb-3">
                      <View className="bg-gray-800 rounded-full px-4 py-2 flex-row items-center gap-3">
                        <Text>🚬</Text>
                        <Text className="text-white text-base font-OutfitMedium">{profile.smoking}</Text>
                      </View>
                    </View>
                  )}
                  {profile.exercise && (
                    <View className="w-1/2 px-1.5 mb-3">
                      <View className="bg-gray-800 rounded-full px-4 py-2 flex-row items-center gap-3">
                        <Text>🏋️‍♂️</Text>
                        <Text className="text-white text-base font-OutfitMedium">{profile.exercise}</Text>
                      </View>
                    </View>
                  )}
                  {profile.pets && (
                    <View className="w-1/2 px-1.5 mb-3">
                      <View className="bg-gray-800 rounded-full px-4 py-2 flex-row items-center gap-3">
                        <Text>🐶</Text>
                        <Text className="text-white text-base font-OutfitMedium">{profile.pets}</Text>
                      </View>
                    </View>
                  )}
                  {profile.children && (
                    <View className="w-1/2 px-1.5 mb-3">
                      <View className="bg-gray-800 rounded-full px-4 py-2 flex-row items-center gap-3">
                        <Text>👶</Text>
                        <Text className="text-white text-base font-OutfitMedium">{profile.children}</Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* ══════════════════════════════════════════════════════
                 RELATIONSHIP
               ══════════════════════════════════════════════════════ */}
            {profile.relationshipType && (
              <View className=" p-5 mb-2 mx-3 rounded-2xl " style={themeStyles.boxContainer}>
                <Text className="text-[20px] font-OutfitSemiBold text-primary ml-2 mb-3">
                  Relationship
                </Text>
                <View className="bg-gray-800 rounded-full px-4 py-2 flex-row items-center gap-3 self-start">
                  <Text>💍</Text>
                  <Text className="text-white text-base font-OutfitMedium">{profile.relationshipType}</Text>
                </View>
              </View>
            )}

            {/* ══════════════════════════════════════════════════════
                 RELIGION PRACTICE
               ══════════════════════════════════════════════════════ */}
            {profile.religionPractice && (
              <View className=" p-5 mb-2 mx-3 rounded-2xl " style={themeStyles.boxContainer}>
                <Text className="text-gray-400 font-Outfit text-white text-base ml-2 mb-1">
                  {profile.firstName || profile.name} says...
                </Text>
                <Text className="text-white font-OutfitBold text-2xl leading-relaxed capitalize ml-2">
                  I&apos;m {profile.religionPractice} 
                </Text>
              </View>
            )}

            {/* ══════════════════════════════════════════════════════
                 RELOCATE FOR MARRIAGE
               ══════════════════════════════════════════════════════ */}
            {profile.willRelocateForMarriage && (
              <View className=" p-5 mb-2 mx-3 rounded-2xl " style={themeStyles.boxContainer}>
                <Text className="text-white font-Outfit  text-base ml-2 mb-1">
                  {profile.firstName || profile.name} says...
                </Text>
                <Text className="text-white font-OutfitBold text-2xl leading-relaxed capitalize ml-2">
                  {profile.willRelocateForMarriage} to relocating for marriage
                </Text>
              </View>
            )}

            {/* ══════════════════════════════════════════════════════
                 SAME BELIEFS
               ══════════════════════════════════════════════════════ */}
            {profile.religionImportance && (
              <View className=" p-5 mb-2 mx-3 rounded-2xl " style={themeStyles.boxContainer}>
                <Text className=" font-Outfit text-white text-base ml-2 mb-1">
                  {profile.firstName || profile.name} says...
                </Text>
                <Text className="text-white font-OutfitBold text-2xl leading-relaxed capitalize ml-2">
                  Same belief  {profile.religionImportance} to me
                </Text>
              </View>
            )}

            {/* ══════════════════════════════════════════════════════
                 PERSONALITY
                 (love language, communication style, financial style)
               ══════════════════════════════════════════════════════ */}
            {(profile.loveStyle || profile.communicationStyle || profile.financialStyle) && (
              <View className=" p-5 mb-2 mx-3 rounded-2xl " style={themeStyles.boxContainer}>
                <Text className="text-[20px] font-OutfitSemiBold text-primary ml-2 mb-4">
                  Personality
                </Text>
                <View className="flex-row flex-wrap -mx-1.5">
                  {profile.loveStyle && (
                    <View className="w-1/2 px-1.5 mb-3">
                      <View className="bg-gray-800 rounded-full px-4 py-2 flex-row items-center gap-3">
                        <Text>❤️</Text>
                        <Text className="text-white text-base font-OutfitMedium">{profile.loveStyle}</Text>
                      </View>
                    </View>
                  )}
                  {profile.communicationStyle && (
                    <View className="w-1/2 px-1.5 mb-3">
                      <View className="bg-gray-800 rounded-full px-4 py-2 flex-row items-center gap-3">
                        <Text>💬</Text>
                        <Text className="text-white text-base font-OutfitMedium">{profile.communicationStyle}</Text>
                      </View>
                    </View>
                  )}
                  {profile.financialStyle && (
                    <View className="w-1/2 px-1.5 mb-3">
                      <View className="bg-gray-800 rounded-full px-4 py-2 flex-row items-center gap-3">
                        <Text>💰</Text>
                        <Text className="text-white text-base font-OutfitMedium">{profile.financialStyle}</Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* ══════════════════════════════════════════════════════
                 PERSONALITIES (traits)
               ══════════════════════════════════════════════════════ */}
            {profile.personalities?.length > 0 && (
              <View className=" p-6 mb-2" style={themeStyles.boxContainer}>
                <Text className="text-[20px] font-OutfitSemiBold text-primary mb-3">
                  Personalities
                </Text>
                <View className="flex-row flex-wrap">
                  {profile.personalities.map((p, i) => (
                    <Chip key={i} label={p} />
                  ))}
                </View>
              </View>
            )}

            {/* ── Image 3 preview ── */}
            {profileImages[2] && (
              <TouchableOpacity
                onPress={() => openImageModal(2)}
                activeOpacity={0.9}
                style={localStyles.imagePreview}
              >
                <Image
                  source={{ uri: profileImages[2] }}
                  style={localStyles.previewImg}
                  contentFit="cover"
                />
              </TouchableOpacity>
            )}

            {/* ══════════════════════════════════════════════════════
                 EDUCATION & CAREER
               ══════════════════════════════════════════════════════ */}
            {(profile.school || profile.education || profile.occupation) && (
              <View className=" p-5 mb-2 mx-3 rounded-2xl " style={themeStyles.boxContainer}>
                <Text className="text-[20px] font-OutfitSemiBold text-primary mb-3">
                  Education & Career
                </Text>
                <View style={{flex: 1}} className="flex-row flex-wrap gap-2">
                  {profile.school && (
                    <View className="bg-gray-800 flex-row items-center gap-2 px-4 py-2 rounded-full">
                      <Text>🏫</Text>
                      <Text className="text-white text-base font-OutfitMedium">{profile.school}</Text>
                    </View>
                  )}
                  {profile.education && (
                    <View className="bg-gray-800 flex-row items-center gap-2 px-4 py-2 rounded-full">
                      <Text>🎓</Text>
                      <Text className="text-white text-base font-OutfitMedium">{profile.education}</Text>
                    </View>
                  )}
                  {profile.occupation && (
                    <View className="bg-gray-800 flex-row items-center gap-2 px-4 py-2 rounded-full">
                      <Text>💼</Text>
                      <Text className="text-white text-base font-OutfitMedium">{profile.occupation}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* ══════════════════════════════════════════════════════
                 LANGUAGES
               ══════════════════════════════════════════════════════ */}
            {profile.language?.length > 0 && (
              <View className=" p-5 mb-2 mx-3 rounded-2xl " style={themeStyles.boxContainer}>
                <Text className="text-[20px] font-OutfitSemiBold text-primary mb-3">
                  Languages
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {profile.language.map((lang, i) => (
                    <View key={i} className="bg-gray-800 flex-row items-center gap-2 px-4 py-2 rounded-full">
                      <Text>🗣️</Text>
                      <Text className="text-white text-base font-OutfitMedium">{lang}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* ══════════════════════════════════════════════════════
                 BLOOD GROUP & GENOTYPE
               ══════════════════════════════════════════════════════ */}
            {(profile.bloodGroup || profile.genotype) && (
              <View className=" p-5 mb-2 mx-3 rounded-2xl " style={themeStyles.boxContainer}>
                <Text className="text-[20px] font-OutfitSemiBold text-primary mb-3">
                  Blood Group & Genotype
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {profile.bloodGroup && (
                    <View className="bg-gray-800 flex-row items-center gap-2 px-4 py-2 rounded-full">
                      <Text>🩸</Text>
                      <Text className="text-white text-base font-OutfitMedium">{profile.bloodGroup}</Text>
                    </View>
                  )}
                  {profile.genotype && (
                    <View className="bg-gray-800 flex-row items-center gap-2 px-4 py-2 rounded-full">
                      <Text>🧬</Text>
                      <Text className="text-white text-base font-OutfitMedium">{profile.genotype}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* ── Question 2 ── */}
            {profile.questions?.[1] && (
              <View className=" mb-2 p-5 mx-3 rounded-2xl " style={themeStyles.boxContainer}>
                <Text className="text-white font-Outfit text-base">
                  {profile.questions[1].question}
                </Text>
                <Text className="text-white font-OutfitBold text-2xl leading-relaxed">
                  {profile.questions[1].answer}
                </Text>
              </View>
            )}

            {/* ── Image 4 preview ── */}
            {profileImages[3] && (
              <TouchableOpacity
                onPress={() => openImageModal(3)}
                activeOpacity={0.9}
                style={localStyles.imagePreview}
              >
                <Image
                  source={{ uri: profileImages[3] }}
                  style={localStyles.previewImg}
                  contentFit="cover"
                />
              </TouchableOpacity>
            )}

            {/* ── Question 3 ── */}
            {profile.questions?.[2] && (
              <View className=" mb-2 p-5 mx-3 rounded-2xl " style={themeStyles.boxContainer}>
                <Text className="text-white font-Outfit text-base">
                  {profile.questions[2].question}
                </Text>
                <Text className="text-white font-OutfitBold text-2xl leading-relaxed">
                  {profile.questions[2].answer}
                </Text>
              </View>
            )}

            {/* ── Interests ── */}
            {profile.interests?.length > 0 && (
              <View className=" mb-2 p-5 mx-3 rounded-2xl " style={themeStyles.boxContainer}>
                <Text className="text-[20px] font-OutfitSemiBold text-primary mb-3">
                  Interests
                </Text>
                <View className="flex-row flex-wrap">
                  {profile.interests.map((interest, i) => (
                    <Chip key={i} label={interest} />
                  ))}
                </View>
              </View>
            )}

            {/* ── Completion tip ── */}
            <View style={localStyles.tipBox}>
              <Text style={localStyles.tipEmoji}>✨</Text>
              <Text style={localStyles.tipText}>
                This is how other users see your profile. Keep it updated to attract better matches!
              </Text>
            </View>

          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
};

export default OwnProfileCard;

const localStyles = StyleSheet.create({
  imagePreview: {
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 16,
    overflow: "hidden",
  },
  previewImg: {
    width: "100%",
    height: SW * 0.85,
  },
  tipBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 24,
    backgroundColor: '#2A2218',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#FDBA74",
  },
  tipEmoji: { fontSize: 18 },
  tipText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Outfit",
    color: "#92400E",
    lineHeight: 20,
  },
});
