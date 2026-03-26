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

import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Image } from "expo-image";
import {
    Baby,
    Briefcase,
    Cigarette,
    Dog,
    Droplet,
    Dumbbell,
    GraduationCap,
    Heart,
    MapPin,
    Ruler,
    Wallet,
    Wine,
} from "lucide-react-native";
import { useMemo, useState } from "react";
import {
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Icons } from "../../constant/icons";
import { usePersistentUriCache } from "../../hooks/usePersistentUriCache";
import ProfileHeroSection from "./profileCard/ProfileHeroSection";
import ProfileImageModal from "./profileCard/ProfileImageModal";

const MAX_BIO_LENGTH = 120;
const { width: SW } = Dimensions.get("window");
const FALLBACK_PROFILE_IMAGE =
  "https://via.placeholder.com/800x1200?text=No+Photo";

// ─── Reusable chip ────────────────────────────────────────────────────────────
const Chip = ({ label, isMutual }) => (
  <View
    className={`rounded-full px-4 py-2 mr-2 mb-2 flex-row items-center gap-1 ${
      isMutual ? "bg-primary/10 border border-primary/30" : "bg-gray-100"
    }`}
  >
    {isMutual && <Text style={{ fontSize: 11 }}>✨</Text>}
    <Text
      className={`font-PlusJakartaSansMedium text-base ${
        isMutual ? "text-primary" : "text-black"
      }`}
    >
      {label}
    </Text>
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
                    <View>
   {profile?.tagline && (
                      <View className="bg-white -mt-20 pt-10 px-4 pb-3 rounded-t-2xl mb-2">
                        <Text className="text-3xl  font-PlusJakartaSansSemiBold ">
                         {profile.tagline}
                        </Text>
                      </View>
                    )}
                    </View>
                 

          <View className="py-3">

            {/* ── Looking For ── */}
            {profile.lookingFor && (
              <View className="bg-white p-5 mb-2 mx-2 rounded-2xl border border-gray-200">
                <Text className="text-[18px] font-PlusJakartaSansSemiBold text-app mb-2">
                  Looking for
                </Text>
                <View className="self-start bg-gray-100 px-5 py-2 rounded-full">
                  <Text className="text-black text-[18px] font-PlusJakartaSans">
                    {profile.lookingFor}
                  </Text>
                </View>
              </View>
            )}

            {/* ── Bio ── */}
            {profile.bio && (
              <View className="bg-white p-5 mb-2 mx-2 rounded-2xl border border-gray-200">
                <Text className="text-[18px] font-PlusJakartaSansSemiBold text-app mb-3">
                  Bio
                </Text>
                <Text className="text-app font-PlusJakartaSans text-[16px]">
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
              <View className="bg-white p-5 mb-2 mx-2 rounded-2xl border border-gray-200">
                <Text className="text-app font-PlusJakartaSans text-base">
                  {profile.questions[0].question}
                </Text>
                <Text className="text-app font-PlusJakartaSansBold text-2xl leading-relaxed capitalize">
                  {profile.questions[0].answer}
                </Text>
              </View>
            )}

            {/* ── Religion Practice ── */}
            {profile.religionPractice && (
              <View className="bg-white p-5 mb-2 mx-2 rounded-2xl border border-gray-200">
                <Text className="text-app font-PlusJakartaSans text-base">
                  How religious are you?
                </Text>
                <Text className="text-app font-PlusJakartaSansBold text-2xl leading-relaxed capitalize">
                  {profile.religionPractice}
                </Text>
              </View>
            )}

            {/* ── Relocation Plan ── */}
            {profile.willRelocateForMarriage && (
              <View className="bg-white p-5 mb-2 mx-2 rounded-2xl border border-gray-200">
                <Text className="text-app font-PlusJakartaSans text-base">
                  Would you relocate for marriage?
                </Text>
                <Text className="text-app font-PlusJakartaSansBold text-2xl leading-relaxed capitalize">
                  {profile.willRelocateForMarriage}
                </Text>
              </View>
            )}

            {/* ── Image 2 preview (no comment box) ── */}
            {profileImages[1] && (
              <TouchableOpacity
                onPress={() => openImageModal(1)}
                activeOpacity={0.9}
                style={styles.imagePreview}
              >
                <Image
                  source={{ uri: profileImages[1] }}
                  style={styles.previewImg}
                  contentFit="cover"
                />
              </TouchableOpacity>
            )}

            {/* ── Essentials ── */}
            <View className="bg-white p-5 mb-2 mx-3 rounded-2xl border border-gray-200">
              <Text className="text-[20px] font-PlusJakartaSansSemiBold text-app ml-2 mb-4">
                Essentials
              </Text>
              <View className="flex-row flex-wrap -mx-1.5">
                {profile.distance && (
                  <View className="w-1/2 px-1.5 mb-3">
                    <View className="bg-gray-100 rounded-full px-4 py-2 flex-row items-center gap-3">
                      <MapPin color="black" size={18} />
                      <Text className="text-app text-base font-PlusJakartaSansMedium">{profile.distance}</Text>
                    </View>
                  </View>
                )}
                {profile.occupation && (
                  <View className="w-1/2 px-1.5 mb-3">
                    <View className="bg-gray-100 rounded-full px-4 py-2 flex-row items-center gap-3">
                      <Briefcase color="black" size={18} />
                      <Text className="text-app text-base font-PlusJakartaSansMedium">{profile.occupation}</Text>
                    </View>
                  </View>
                )}
                {profile.height && (
                  <View className="w-1/2 px-1.5 mb-3">
                    <View className="bg-gray-100 rounded-full px-4 py-2 flex-row items-center gap-3">
                      <Ruler color="black" size={18} />
                      <Text className="text-app text-base font-PlusJakartaSansMedium">{profile.height}cm</Text>
                    </View>
                  </View>
                )}
                {profile.religion && (
                  <View className="w-1/2 px-1.5 mb-3">
                    <View className="bg-gray-100 rounded-full px-4 py-2 flex-row items-center gap-3">
                      <MaterialCommunityIcons name="hands-pray" size={20} color="black" />
                      <Text className="text-app text-base font-PlusJakartaSansMedium">{profile.religion}</Text>
                    </View>
                  </View>
                )}
                {profile.drinking && (
                  <View className="w-1/2 px-1.5 mb-3">
                    <View className="bg-gray-100 rounded-full px-4 py-2 flex-row items-center gap-3">
                      <Wine color="black" size={18} />
                      <Text className="text-app text-base font-PlusJakartaSansMedium">{profile.drinking}</Text>
                    </View>
                  </View>
                )}
                {profile.smoking && (
                  <View className="w-1/2 px-1.5 mb-3">
                    <View className="bg-gray-100 rounded-full px-4 py-2 flex-row items-center gap-3">
                      <Cigarette color="black" size={18} />
                      <Text className="text-base font-PlusJakartaSansMedium">{profile.smoking}</Text>
                    </View>
                  </View>
                )}
                {profile.children && (
                  <View className="w-1/2 px-1.5 mb-3">
                    <View className="bg-gray-100 rounded-full px-4 py-2 flex-row items-center gap-3">
                      <Baby color="black" size={18} />
                      <Text className="text-app text-base font-PlusJakartaSansMedium">{profile.children}</Text>
                    </View>
                  </View>
                )}
                {profile.pets && (
                  <View className="w-1/2 px-1.5 mb-3">
                    <View className="bg-gray-100 rounded-full px-4 py-2 flex-row items-center gap-3">
                      <Dog color="black" size={18} />
                      <Text className="text-app text-base font-PlusJakartaSansMedium">{profile.pets}</Text>
                    </View>
                  </View>
                )}
                {profile.exercise && (
                  <View className="w-1/2 px-1.5 mb-3">
                    <View className="bg-gray-100 rounded-full px-4 py-2 flex-row items-center gap-3">
                      <Dumbbell color="black" size={18} />
                      <Text className="text-app text-base font-PlusJakartaSansMedium">{profile.exercise}</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* ── Basics ── */}
            <View className="bg-white p-5 mb-2 mx-3 rounded-2xl border border-gray-200">
              <Text className="text-[20px] font-PlusJakartaSansSemiBold text-app ml-2 mb-4">
                Basics
              </Text>
              <View className="flex-row flex-wrap -mx-1.5">
                {profile.zodiac && (
                  <View className="w-1/2 px-1.5 mb-3">
                    <View className="bg-gray-100 rounded-full px-4 py-2 flex-row items-center gap-3">
                      <Image source={Icons.zodiacSign} />
                      <Text className="text-app text-base font-PlusJakartaSansMedium">{profile.zodiac}</Text>
                    </View>
                  </View>
                )}
                {profile.loveStyle && (
                  <View className="w-1/2 px-1.5 mb-3">
                    <View className="bg-gray-100 rounded-full px-4 py-2 flex-row items-center gap-3">
                      <Heart color="black" size={18} />
                      <Text className="text-app text-base font-PlusJakartaSansMedium">{profile.loveStyle}</Text>
                    </View>
                  </View>
                )}
                {profile.communicationStyle && (
                  <View className="w-1/2 px-1.5 mb-3">
                    <View className="bg-gray-100 rounded-full px-4 py-2 flex-row items-center gap-3">
                      <Heart color="black" size={18} />
                      <Text className="text-app text-base font-PlusJakartaSansMedium">{profile.communicationStyle}</Text>
                    </View>
                  </View>
                )}
                {profile.financialStyle && (
                  <View className="w-1/2 px-1.5 mb-3">
                    <View className="bg-gray-100 rounded-full px-4 py-2 flex-row items-center gap-3">
                      <Wallet size={20} color="black" />
                      <Text className="text-app text-base font-PlusJakartaSansMedium">{profile.financialStyle}</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* ── Personalities ── */}
            {profile.personalities?.length > 0 && (
              <View className="bg-white p-6 mb-2">
                <Text className="text-[20px] font-PlusJakartaSansSemiBold text-app mb-3">
                  Personalities
                </Text>
                <View className="flex-row flex-wrap">
                  {profile.personalities.map((p, i) => (
                    <Chip key={i} label={p} isMutual={false} />
                  ))}
                </View>
              </View>
            )}

            {/* ── Image 3 preview ── */}
            {profileImages[2] && (
              <TouchableOpacity
                onPress={() => openImageModal(2)}
                activeOpacity={0.9}
                style={styles.imagePreview}
              >
                <Image
                  source={{ uri: profileImages[2] }}
                  style={styles.previewImg}
                  contentFit="cover"
                />
              </TouchableOpacity>
            )}

            {/* ── Education ── */}
            {profile.school && (
              <View className="bg-white mb-2 p-5 mx-3 rounded-2xl border border-gray-200">
                <Text className="text-[20px] font-PlusJakartaSansSemiBold text-app mb-3">
                  School and education
                </Text>
                <View className="flex-1 flex-row flex-wrap gap-2">
                  <View className="bg-gray-100 flex-row items-center gap-2 px-4 py-2 rounded-full">
                    <GraduationCap color="black" size={18} />
                    <Text className="text-app text-base font-PlusJakartaSansMedium">{profile.school}</Text>
                  </View>
                  {profile.education && (
                    <View className="bg-gray-100 flex-row items-center gap-2 px-4 py-2 rounded-full">
                      <GraduationCap color="black" size={18} />
                      <Text className="text-app text-base font-PlusJakartaSansMedium">{profile.education}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* ── Languages & Ethnicity ── */}
            {profile.language?.length > 0 && (
              <View className="bg-white mb-2 p-5 mx-3 rounded-2xl border border-gray-200">
                <Text className="text-[20px] font-PlusJakartaSansSemiBold text-app mb-3">
                  Languages and ethnicity
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {profile.language.map((lang, i) => (
                    <View key={i} className="bg-gray-100 flex-row items-center gap-2 px-4 py-2 rounded-full">
                      <Text className="text-app text-base font-PlusJakartaSansMedium">{lang}</Text>
                    </View>
                  ))}
                </View>
                {profile.nationality && (
                  <View className="mt-2 flex-row flex-wrap gap-2">
                    <View className="bg-gray-100 flex-row items-center gap-2 px-4 py-2 rounded-full">
                      <Text className="text-app text-base font-PlusJakartaSansMedium">{profile.nationality}</Text>
                    </View>
                    {profile.ethnicity && (
                      <View className="bg-gray-100 flex-row items-center gap-2 px-4 py-2 rounded-full">
                        <Text className="text-app text-base font-PlusJakartaSansMedium">{profile.ethnicity}</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* ── Health Information ── */}
            {(profile.bloodGroup || profile.genotype) && (
              <View className="bg-white mb-2 p-5 mx-3 rounded-2xl border border-gray-200">
                <Text className="text-[20px] font-PlusJakartaSansSemiBold text-app mb-3">
                  Health Information
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {profile.bloodGroup && (
                    <View className="bg-gray-100 flex-row items-center gap-2 px-4 py-2 rounded-full">
                      <Droplet color="red" size={18} />
                      <Text className="text-app text-base font-PlusJakartaSansMedium">{profile.bloodGroup}</Text>
                    </View>
                  )}
                  {profile.genotype && (
                    <View className="bg-gray-100 flex-row items-center gap-2 px-4 py-2 rounded-full">
                      <Text className="text-app text-base font-PlusJakartaSansMedium">{profile.genotype}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* ── Question 2 ── */}
            {profile.questions?.[1] && (
              <View className="bg-white mb-2 p-5 mx-3 rounded-2xl border border-gray-200">
                <Text className="text-app font-PlusJakartaSans text-base">
                  {profile.questions[1].question}
                </Text>
                <Text className="text-app font-PlusJakartaSansBold text-2xl leading-relaxed">
                  {profile.questions[1].answer}
                </Text>
              </View>
            )}

            {/* ── Image 4 preview ── */}
            {profileImages[3] && (
              <TouchableOpacity
                onPress={() => openImageModal(3)}
                activeOpacity={0.9}
                style={styles.imagePreview}
              >
                <Image
                  source={{ uri: profileImages[3] }}
                  style={styles.previewImg}
                  contentFit="cover"
                />
              </TouchableOpacity>
            )}

            {/* ── Interests ── */}
            {profile.interests?.length > 0 && (
              <View className="bg-white mb-2 p-5 mx-3 rounded-2xl border border-gray-200">
                <Text className="text-[20px] font-PlusJakartaSansSemiBold text-app mb-3">
                  Interests
                </Text>
                <View className="flex-row flex-wrap">
                  {profile.interests.map((interest, i) => (
                    <Chip key={i} label={interest} isMutual={false} />
                  ))}
                </View>
              </View>
            )}

            {/* ── Completion tip ── */}
            <View style={styles.tipBox}>
              <Text style={styles.tipEmoji}>✨</Text>
              <Text style={styles.tipText}>
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

const styles = StyleSheet.create({
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
    backgroundColor: "#FFF7ED",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#FDBA74",
  },
  tipEmoji: { fontSize: 18 },
  tipText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "PlusJakartaSans",
    color: "#92400E",
    lineHeight: 20,
  },
});
