import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Image } from "expo-image";
import {
    Baby,
    Ban,
    Briefcase,
    Cigarette,
    Dog,
    Dumbbell,
    Flag,
    GraduationCap,
    Heart,
    MapPin,
    Ruler,
    Share2,
    Wallet,
    Wine,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    findNodeHandle, Share, Text,
    TouchableOpacity,
    UIManager,
    View
} from "react-native";
import { useSelector } from "react-redux";
import { Icons } from "../../constant/icons";
import { usePersistentUriCache } from "../../hooks/usePersistentUriCache";
import AIService from "../../services/aiService";
import AiMatchSuggestionModal from "../modals/AiMatchSuggestionModal";
import BlockReportModal from "../modals/Blockreportmodal";
import CommentBox from "../ui/CommentBox";
import DirectMessageBox from "../ui/DirectMessageBox";
import ProfileHeroSection from "./profileCard/ProfileHeroSection";
import ProfileImageModal from "./profileCard/ProfileImageModal";

const MAX_BIO_LENGTH = 120;
const { height } = Dimensions.get("window");
const FALLBACK_PROFILE_IMAGE = "https://via.placeholder.com/800x1200?text=No+Photo";

// ─── Reusable highlighted chip ────────────────────────────────────────────────
// isMutual = true  → orange tint (shared with current user)
// isMutual = false → plain grey

const InterestChip = ({ label, isMutual }) => (
  <View
    className={`rounded-full px-4 py-2 mr-2 mb-2 flex-row items-center gap-1 ${
      isMutual ? "bg-primary/10 border border-primary/30" : "bg-gray-100"
    }`}
  >
    {isMutual && (
      <Text style={{ fontSize: 11 }}>✨</Text>
    )}
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

const ProfileCard = ({ profile }) => {
  const [showFullBio, setShowFullBio] = useState(false);
  const currentImageIndex = 0;
  const [modalVisible, setModalVisible] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const [imageLayouts, setImageLayouts] = useState({});
  const [visibleCommentBoxIndex, setVisibleCommentBoxIndex] = useState(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [blockReportModal, setBlockReportModal] = useState({ visible: false, mode: "block" });
  const [compatibilityScore, setCompatibilityScore] = useState(null);
  const [loadingScore, setLoadingScore] = useState(false);
  const [aiMatchModalVisible, setAiMatchModalVisible] = useState(false);

  const { user: currentUser } = useSelector((state) => state.auth);

  const openBlock  = () => setBlockReportModal({ visible: true, mode: "block" });
  const openReport = () => setBlockReportModal({ visible: true, mode: "report" });
  const closeModal = () => setBlockReportModal((prev) => ({ ...prev, visible: false }));

  // Fetch compatibility score
  useEffect(() => {
    const fetchCompatibilityScore = async () => {
      if (!profile?._id && !profile?.id) return;
      
      setLoadingScore(true);
      try {
        const userId = profile._id || profile.id;
        const scoreData = await AIService.getCompatibilityScore(userId);
        setCompatibilityScore(scoreData.score);
      } catch (error) {
        console.error('Failed to fetch compatibility score:', error);
        setCompatibilityScore(null);
      } finally {
        setLoadingScore(false);
      }
    };

    fetchCompatibilityScore();
  }, [profile?._id, profile?.id]);

  // Show AI match suggestion modal after profile loads
  useEffect(() => {
    if (profile && compatibilityScore !== null && !aiMatchModalVisible) {
      // Small delay to let the profile render first
      const timer = setTimeout(() => {
        setAiMatchModalVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [profile, compatibilityScore, aiMatchModalVisible]);

  const handleShare = async () => {
    const name = profile?.name || profile?.firstName || "someone";
    try {
      await Share.share({
        title: `Check out ${name}'s profile on Bondies`,
        message: `Hey! I found someone interesting on Bondies — ${name}. Download the app to connect! 💛`,
      });
    } catch {}
  };

  const scrollViewRef = useRef(null);
  const commentBoxRefs = useRef([]);

  const totalImages = profile?.images?.length || 1;
  const profileImages = useMemo(
    () => (Array.isArray(profile?.images) ? profile.images : []),
    [profile?.images]
  );
  const getImageUri = (index) => profileImages[index] || FALLBACK_PROFILE_IMAGE;

  // Normalise mutualInterests to a Set for O(1) lookup
  const mutualSet = useMemo(
    () => new Set((profile?.mutualInterests ?? []).map((i) => String(i).toLowerCase())),
    [profile?.mutualInterests]
  );
  const isMutual = (item) => mutualSet.has(String(item).toLowerCase());

  const { isHydrated: isImageCacheHydrated, isUriCached, touchUri } =
    usePersistentUriCache({
      storageKey: "@bondify/cache/profile/imageUris",
      maxSize: 500,
    });

  const openImageModal = (index) => {
    setModalImageIndex(index);
    setModalVisible(true);
  };

  const closeImageModal = () => setModalVisible(false);

  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setScrollOffset(offsetY);
    checkCommentBoxVisibility(offsetY);
  };

  const checkCommentBoxVisibility = useCallback(
    (currentScrollOffset) => {
      if (!scrollViewRef.current) return;
      const viewportTop    = currentScrollOffset;
      const viewportBottom = currentScrollOffset + height;

      commentBoxRefs.current.forEach((ref, index) => {
        if (!ref) return;
        UIManager.measure(ref, (x, y, w, h, pageX, pageY) => {
          const isVisible =
            pageY + h > viewportTop + 200 && pageY < viewportBottom - 200;
          if (isVisible) setVisibleCommentBoxIndex(index);
          else if (visibleCommentBoxIndex === index) setVisibleCommentBoxIndex(null);
        });
      });
    },
    [visibleCommentBoxIndex]
  );

  const handleImageLayout = (index, event) => {
    const { y, height: h } = event.nativeEvent.layout;
    setImageLayouts((prev) => ({ ...prev, [index]: { y, height: h } }));
  };

  const setCommentBoxRef = (index, ref) => {
    if (ref) commentBoxRefs.current[index] = findNodeHandle(ref);
  };

  useEffect(() => {
    if (Object.keys(imageLayouts).length > 0) checkCommentBoxVisibility(scrollOffset);
  }, [checkCommentBoxVisibility, imageLayouts, scrollOffset]);

  if (!profile) return null;

  const isBioLong = profile.bio?.length > MAX_BIO_LENGTH;
  const displayedBio = showFullBio
    ? profile.bio
    : profile.bio?.slice(0, MAX_BIO_LENGTH) + (isBioLong ? "..." : "");

  // Count for the section header badge
  const mutualInterestCount = profile?.mutualInterests?.length ?? 0;

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
        ref={scrollViewRef}
        contentContainerStyle={{ paddingBottom: 80 }}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
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
            compatibilityScore={compatibilityScore}
            loadingScore={loadingScore}
          />

          <View className="py-3">

            {/* ── Shared interests ── */}
            {mutualInterestCount > 0 && (
              <View className="bg-white -mt-20 pt-14 p-4 mb-2 rounded-t-2xl">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-app text-[20px] font-PlusJakartaSansSemiBold">
                    Shared interests
                  </Text>
                  {/* Count badge */}
                  <View className="bg-primary/10 px-3 py-1 rounded-full">
                    <Text className="text-primary text-sm font-PlusJakartaSansBold">
                      {mutualInterestCount} in common
                    </Text>
                  </View>
                </View>

                <View className="flex-row flex-wrap">
                  {profile.mutualInterests.map((interest, index) => (
                    <InterestChip key={index} label={interest} isMutual />
                  ))}
                </View>
              </View>
            )}

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

            {/* ── Image 2 comment box ── */}
            <View ref={(ref) => setCommentBoxRef(0, ref)}>
              <CommentBox
                imageUri={profile?.images?.[1]}
                index={1}
                onPress={() => openImageModal(1)}
                showComposer={visibleCommentBoxIndex === 0}
                profile={profile}
              />
            </View>

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

            {/* ── Personalities — highlighted if mutual ── */}
            {profile.personalities?.length > 0 && (
              <View className="bg-white p-6 mb-2">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-[20px] font-PlusJakartaSansSemiBold text-app">
                    Personalities
                  </Text>
                  {profile.personalities.some(isMutual) && (
                    <View className="bg-primary/10 px-3 py-1 rounded-full">
                      <Text className="text-primary text-sm font-PlusJakartaSansBold">
                        {profile.personalities.filter(isMutual).length} shared
                      </Text>
                    </View>
                  )}
                </View>
                <View className="flex-row flex-wrap">
                  {profile.personalities.map((personality, index) => (
                    <InterestChip
                      key={index}
                      label={personality}
                      isMutual={isMutual(personality)}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* ── Image 3 comment box ── */}
            <View ref={(ref) => setCommentBoxRef(1, ref)}>
              <CommentBox
                imageUri={profile?.images?.[2]}
                index={2}
                onPress={() => openImageModal(2)}
                showComposer={visibleCommentBoxIndex === 1}
                profile={profile}
              />
            </View>

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
                  <View className="bg-gray-100 flex-row items-center gap-2 px-4 py-2 rounded-full">
                    <GraduationCap color="black" size={18} />
                    <Text className="text-app text-base font-PlusJakartaSansMedium">{profile.education}</Text>
                  </View>
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
                  {profile.language.map((lang, index) => (
                    <View key={index} className="bg-gray-100 flex-row items-center gap-2 px-4 py-2 rounded-full">
                      <Text className="text-app text-base font-PlusJakartaSansMedium">{lang}</Text>
                    </View>
                  ))}
                </View>
                {profile.nationality && (
                  <View className="mt-2 flex-row flex-wrap gap-2">
                    <View className="bg-gray-100 flex-row items-center gap-2 px-4 py-2 rounded-full">
                      <Text className="text-app text-base font-PlusJakartaSansMedium">{profile.nationality}</Text>
                    </View>
                    <View className="bg-gray-100 flex-row items-center gap-2 px-4 py-2 rounded-full">
                      <Text className="text-app text-base font-PlusJakartaSansMedium">{profile.ethnicity}</Text>
                    </View>
                  </View>
                )}
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

            {/* ── Image 4 comment box ── */}
            <View ref={(ref) => setCommentBoxRef(2, ref)}>
              <CommentBox
                imageUri={profile?.images?.[3]}
                index={3}
                onPress={() => openImageModal(3)}
                showComposer={visibleCommentBoxIndex === 2}
                profile={profile}
              />
            </View>

            {/* ── Interests — highlighted if mutual ── */}
            {profile.interests?.length > 0 && (
              <View className="bg-white mb-2 p-5 mx-3 rounded-2xl border border-gray-200">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-[20px] font-PlusJakartaSansSemiBold text-app">
                    Interests
                  </Text>
                  {profile.interests.some(isMutual) && (
                    <View className="bg-primary/10 px-3 py-1 rounded-full">
                      <Text className="text-primary text-sm font-PlusJakartaSansBold">
                        {profile.interests.filter(isMutual).length} shared ✨
                      </Text>
                    </View>
                  )}
                </View>
                <View className="flex-row flex-wrap">
                  {profile.interests.map((interest, index) => (
                    <InterestChip
                      key={index}
                      label={interest}
                      isMutual={isMutual(interest)}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* ── Direct Message ── */}
            <View className="bg-white mb-2 p-5 mx-3 rounded-2xl border border-gray-200">
              <DirectMessageBox profile={profile} />
            </View>

            {/* ── Share / Block / Report ── */}
            <View className="flex-row justify-between gap-4 my-4">
              <TouchableOpacity
                className="flex-1 p-5 justify-center items-center rounded-2xl"
                onPress={handleShare}
                activeOpacity={0.75}
              >
                <View className="w-16 h-16 bg-white flex-row justify-center items-center rounded-full shadow-sm">
                  <Share2 size={26} color="black" />
                </View>
                <Text className="mt-3 font-PlusJakartaSansMedium">Share</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 p-5 justify-center items-center rounded-2xl"
                onPress={openBlock}
                activeOpacity={0.75}
              >
                <View className="w-16 h-16 bg-red-50 flex-row justify-center items-center rounded-full">
                  <Ban size={26} color="#EF4444" />
                </View>
                <Text className="mt-3 font-PlusJakartaSansMedium text-red-500">Block</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 p-5 justify-center items-center rounded-2xl"
                onPress={openReport}
                activeOpacity={0.75}
              >
                <View className="w-16 h-16 bg-orange-50 flex-row justify-center items-center rounded-full">
                  <Flag size={26} color="#F59E0B" />
                </View>
                <Text className="mt-3 font-PlusJakartaSansMedium text-yellow-600">Report</Text>
              </TouchableOpacity>
            </View>

            {/* ── Block / Report Modal ── */}
            <BlockReportModal
              visible={blockReportModal.visible}
              mode={blockReportModal.mode}
              profile={profile}
              onClose={closeModal}
              onSuccess={(mode) => {
                closeModal();
                // Parent can handle navigation away after block if needed
              }}
            />

            <AiMatchSuggestionModal
              visible={aiMatchModalVisible}
              onClose={() => setAiMatchModalVisible(false)}
              profile={profile}
              currentUser={currentUser}
            />

          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
};

export default ProfileCard;