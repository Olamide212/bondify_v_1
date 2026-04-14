import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Ban,
  Flag,
  Share2,
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
import { styles } from "../../constant/colors";
import { usePersistentUriCache } from "../../hooks/usePersistentUriCache";
import AIService from "../../services/aiService";
import { getProfileMediaUrl, isProfileVideo, normalizeProfileMedia } from "../../utils/profileMedia";
import AiMatchSuggestionModal from "../modals/AiMatchSuggestionModal";
import BlockReportModal from "../modals/Blockreportmodal";
import CommentBox from "../ui/CommentBox";
import DirectMessageBox from "../ui/DirectMessageBox";
import ProfileMediaView from "../ui/ProfileMediaView";
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
      isMutual ? " border border-primary" : "bg-transparent border border-white"
    }`}
  >
    {isMutual && (
      <Text style={{ fontSize: 11 }}>✨</Text>
    )}
    <Text
      className={`font-PlusJakartaSansMedium text-base ${
        isMutual ? "text-primary" : "text-white"
      }`}
    >
      {label}
    </Text>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────

const AI_MODAL_SEEN_KEY = 'ai_match_modal_seen_ids';

const ProfileCard = ({ profile, hideAiSuggestion = false }) => {
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

  // Show AI match suggestion modal once per profile (persisted across sessions)
  useEffect(() => {
    if (hideAiSuggestion) return;

    const pid = profile?._id || profile?.id;
    if (!pid || compatibilityScore === null) return;

    let cancelled = false;

    const checkAndShow = async () => {
      try {
        const raw = await AsyncStorage.getItem(AI_MODAL_SEEN_KEY);
        const seenIds = raw ? JSON.parse(raw) : [];
        if (seenIds.includes(pid)) return; // already shown before

        if (!cancelled) {
          // Persist immediately so even if the user kills the app it won't re-show
          await AsyncStorage.setItem(
            AI_MODAL_SEEN_KEY,
            JSON.stringify([...seenIds, pid])
          );
          setAiMatchModalVisible(true);
        }
      } catch (_e) {
        // storage error — silently skip
      }
    };

    const timer = setTimeout(checkAndShow, 1500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
     
  }, [profile?._id, profile?.id, compatibilityScore, hideAiSuggestion]);

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
    () => normalizeProfileMedia(profile?.images),
    [profile?.images]
  );
  const getImageUri = (index) => getProfileMediaUrl(profileImages[index]) || FALLBACK_PROFILE_IMAGE;
  const getMediaItem = (index) => profileImages[index] || null;

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

  const renderSecondaryMedia = (mediaIndex, commentIndex) => {
    const mediaItem = profileImages[mediaIndex];
    if (!mediaItem) return null;

    if (!isProfileVideo(mediaItem)) {
      return (
        <View ref={(ref) => setCommentBoxRef(commentIndex, ref)}>
          <CommentBox
            imageUri={getImageUri(mediaIndex)}
            index={mediaIndex}
            onPress={() => openImageModal(mediaIndex)}
            showComposer={visibleCommentBoxIndex === commentIndex}
            profile={profile}
            blurPhotos={profile?.blurPhotos}
          />
        </View>
      );
    }

    return (
      <TouchableOpacity
        onPress={() => openImageModal(mediaIndex)}
        activeOpacity={0.9}
        style={styles.mediaPreview}
      >
        <ProfileMediaView
          media={mediaItem}
          containerStyle={styles.mediaPreviewInner}
          style={styles.mediaPreviewInner}
          showVideoBadge
          shouldPlayVideo
          maxPreviewMs={5000}
          blurRadius={profile?.blurPhotos ? 25 : 0}
        />
      </TouchableOpacity>
    );
  };

  return (
    <View className="relative">
      <ProfileImageModal
        visible={modalVisible}
        onClose={closeImageModal}
        totalImages={totalImages}
        modalImageIndex={modalImageIndex}
        onChangeImageIndex={setModalImageIndex}
        getImageUri={getImageUri}
        getMediaItem={getMediaItem}
        isImageCacheHydrated={isImageCacheHydrated}
        isUriCached={isUriCached}
        onMarkUriLoaded={touchUri}
        blurPhotos={profile?.blurPhotos}
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
            likesYou={profile?.likesYou}
          />

                 {/* ── Tagline ── */}
                    <View style={{backgroundColor: '#121212', marginVertical: 20}}>
   {profile.tagline && (
                      <View className="px-4  rounded-t-2xl" >
                        <Text className="text-3xl text-white italic font-PlusJakartaSansSemiBold">
                         &quot;{profile.tagline}&quot;
                        </Text>
                      </View>
                    )}
                    </View>

          <View className="py-3">

            {/* ── Shared interests ── */}
            {mutualInterestCount > 0 && (
              <View className=" -mt-20 pt-14 p-4 mb-2 rounded-t-2xl" style={styles.boxContainer}>
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-app text-[20px] font-PlusJakartaSansSemiBold">
                    Shared interests
                  </Text>
              
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

            {/* ══════════════════════════════════════════════════════
                 LOOKING FOR
               ══════════════════════════════════════════════════════ */}
          
            {profile.lookingFor && (
              <View className=" p-5 mb-2 mx-2 rounded-2xl " style={styles.boxContainer}>
                <Text className="text-[20px] font-PlusJakartaSansSemiBold text-primary ml-2 mb-3">
                  Looking For
                </Text>
                <View className="bg-gray-800 rounded-full px-4 py-2 flex-row items-center gap-3 self-start">
                  <Text>💘</Text>
                  <Text className="text-white text-xl font-PlusJakartaSansMedium">{profile.lookingFor}</Text>
                </View>
              </View>
            )}

            {/* ── Bio ── */}
            {profile.bio && (
              <View className=" p-5 mb-2 mx-2 rounded-2xl " style={styles.boxContainer}>
                <Text className="text-[18px] font-PlusJakartaSansSemiBold text-primary mb-3">
                  Bio
                </Text>
                <Text className="text-white font-PlusJakartaSans text-[16px]">
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
              <View className=" p-5 mb-2 mx-2 rounded-2xl " style={styles.boxContainer}>
                <Text className="text-white font-PlusJakartaSans text-base">
                  {profile.questions[0].question}
                </Text>
                <Text className="text-white font-PlusJakartaSansBold text-2xl leading-relaxed capitalize">
                  {profile.questions[0].answer}
                </Text>
              </View>
            )}

            {/* ── Image 2 comment box ── */}
            {renderSecondaryMedia(1, 0)}

            {/* ══════════════════════════════════════════════════════
                 BASICS
                 (zodiac, height, religion, nationality, ethnicity, distance)
               ══════════════════════════════════════════════════════ */}
            <View className=" p-5 mb-2 mx-3 rounded-2xl " style={styles.boxContainer}>
              <Text className="text-[20px] font-PlusJakartaSansSemiBold text-primary ml-2 mb-4">
                Basics
              </Text>
              <View className="flex-row flex-wrap -mx-1.5">
                {profile.zodiac && (
                  <View className="w-1/2 px-1.5 mb-3">
                    <View className="bg-gray-800 rounded-full px-4 py-2 flex-row items-center gap-3">
                      <Text>♉️</Text>
                      <Text className="text-white text-base font-PlusJakartaSansMedium">{profile.zodiac}</Text>
                    </View>
                  </View>
                )}
                {profile.height && (
                  <View className="w-1/2 px-1.5 mb-3">
                    <View className="bg-gray-800 rounded-full px-4 py-2 flex-row items-center gap-3">
                      <Text>📏</Text>
                      <Text className="text-white text-base font-PlusJakartaSansMedium">{profile.height}cm</Text>
                    </View>
                  </View>
                )}
                {profile.religion && (
                  <View className="w-1/2 px-1.5 mb-3">
                    <View className="bg-gray-800 rounded-full px-4 py-2 flex-row items-center gap-3">
                      <Text>🙏</Text>
                      <Text className="text-white text-base font-PlusJakartaSansMedium">{profile.religion}</Text>
                    </View>
                  </View>
                )}
                {profile.nationality && (
                  <View className="w-1/2 px-1.5 mb-3">
                    <View className="bg-gray-800 rounded-full px-4 py-2 flex-row items-center gap-3">
                      <Text>🌍</Text>
                      <Text className="text-white text-base capitalize font-PlusJakartaSansMedium">{profile.nationality}</Text>
                    </View>
                  </View>
                )}
                {profile.ethnicity && (
                  <View className="w-1/2 px-1.5 mb-3">
                    <View className="bg-gray-800 rounded-full px-4 py-2 flex-row items-center gap-3">
                      <Text>👤</Text>
                      <Text className="text-white text-base capitalize font-PlusJakartaSansMedium">{profile.ethnicity}</Text>
                    </View>
                  </View>
                )}
                {profile.distance && (
                  <View className="w-1/2 px-1.5 mb-3">
                    <View className="bg-gray-800 rounded-full px-4 py-2 flex-row items-center gap-3">
                      <Text>📍</Text>
                      <Text className="text-white text-base font-PlusJakartaSansMedium">{profile.distance}</Text>
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
              <View className=" p-5 mb-2 mx-3 rounded-2xl " style={styles.boxContainer}>
                <Text className="text-[20px] font-PlusJakartaSansSemiBold text-primary ml-2 mb-4">
                  Lifestyle
                </Text>
                <View className="flex-row flex-wrap -mx-1.5">
                  {profile.drinking && (
                    <View className="w-1/2 px-1.5 mb-3">
                      <View className="bg-gray-800 rounded-full px-4 py-2 flex-row items-center gap-3">
                        <Text>🍷</Text>
                        <Text className="text-white text-base font-PlusJakartaSansMedium">{profile.drinking}</Text>
                      </View>
                    </View>
                  )}
                  {profile.smoking && (
                    <View className="w-1/2 px-1.5 mb-3">
                      <View className="bg-gray-800 rounded-full px-4 py-2 flex-row items-center gap-3">
                        <Text>🚬</Text>
                        <Text className="text-white text-base font-PlusJakartaSansMedium">{profile.smoking}</Text>
                      </View>
                    </View>
                  )}
                  {profile.exercise && (
                    <View className="w-1/2 px-1.5 mb-3">
                      <View className="bg-gray-800 rounded-full px-4 py-2 flex-row items-center gap-3">
                        <Text>🏋️‍♂️</Text>
                        <Text className="text-white text-base font-PlusJakartaSansMedium">{profile.exercise}</Text>
                      </View>
                    </View>
                  )}
                  {profile.pets && (
                    <View className="w-1/2 px-1.5 mb-3">
                      <View className="bg-gray-800 rounded-full px-4 py-2 flex-row items-center gap-3">
                        <Text>🐶</Text>
                        <Text className="text-white text-base font-PlusJakartaSansMedium">{profile.pets}</Text>
                      </View>
                    </View>
                  )}
                  {profile.children && (
                    <View className="w-1/2 px-1.5 mb-3">
                      <View className="bg-gray-800 rounded-full px-4 py-2 flex-row items-center gap-3">
                        <Text>👶</Text>
                        <Text className="text-white text-base font-PlusJakartaSansMedium">{profile.children}</Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* ══════════════════════════════════════════════════════
                 RELATIONSHIP
                 (relationship status)
               ══════════════════════════════════════════════════════ */}
            {profile.relationshipType && (
              <View className=" p-5 mb-2 mx-3 rounded-2xl " style={styles.boxContainer}>
                <Text className="text-[20px] font-PlusJakartaSansSemiBold text-primary ml-2 mb-3">
                  Relationship
                </Text>
                <View className="bg-gray-800 rounded-full px-4 py-2 flex-row items-center gap-3 self-start">
                  <Text>💍</Text>
                  <Text className="text-white text-base font-PlusJakartaSansMedium">{profile.relationshipType}</Text>
                </View>
              </View>
            )}

            {/* ══════════════════════════════════════════════════════
                 RELIGION PRACTICE
               ══════════════════════════════════════════════════════ */}
            {profile.religionPractice && (
              <View className=" p-5 mb-2 mx-3 rounded-2xl " style={styles.boxContainer}>
                <Text className="text-white font-PlusJakartaSans text-base ml-2 mb-1">
                  {profile.firstName || profile.name} says...
                </Text>
                <Text className="text-white font-PlusJakartaSansBold text-2xl leading-relaxed capitalize ml-2">
                  I&apos;m {profile.religionPractice} 
                </Text>
              </View>
            )}

            {/* ══════════════════════════════════════════════════════
                 RELOCATE FOR MARRIAGE
               ══════════════════════════════════════════════════════ */}
            {profile.willRelocateForMarriage && (
              <View className=" p-5 mb-2 mx-3 rounded-2xl " style={styles.boxContainer}>
                <Text className="text-white font-PlusJakartaSans text-base ml-2 mb-1">
                  {profile.firstName || profile.name} says...
                </Text>
                <Text className="text-white font-PlusJakartaSansBold text-2xl leading-relaxed capitalize ml-2">
                  {profile.willRelocateForMarriage} to relocating for marriage
                </Text>
              </View>
            )}

            {/* ══════════════════════════════════════════════════════
                 SAME BELIEFS
               ══════════════════════════════════════════════════════ */}
            {profile.religionImportance && (
              <View className=" p-5 mb-2 mx-3 rounded-2xl " style={styles.boxContainer}>
                <Text className="text-white font-PlusJakartaSans text-base ml-2 mb-1">
                  {profile.firstName || profile.name} says...
                </Text>
                <Text className="text-white font-PlusJakartaSansBold text-2xl leading-relaxed capitalize ml-2">
                  Same belief is {profile.religionImportance} to me
                </Text>
              </View>
            )}

            {/* ══════════════════════════════════════════════════════
                 PERSONALITY
                 (love language, communication style, financial style)
               ══════════════════════════════════════════════════════ */}
            {(profile.loveStyle || profile.communicationStyle || profile.financialStyle) && (
              <View className=" p-5 mb-2 mx-3 rounded-2xl " style={styles.boxContainer}>
                <Text className="text-[20px] font-PlusJakartaSansSemiBold text-primary ml-2 mb-4">
                  Personality
                </Text>
                <View className="flex-row flex-wrap -mx-1.5">
                  {profile.loveStyle && (
                    <View className="w-1/2 px-1.5 mb-3">
                      <View className="bg-gray-800 rounded-full px-4 py-2 flex-row items-center gap-3">
                        <Text>❤️</Text>
                        <Text className="text-white text-base font-PlusJakartaSansMedium">{profile.loveStyle}</Text>
                      </View>
                    </View>
                  )}
                  {profile.communicationStyle && (
                    <View className="w-1/2 px-1.5 mb-3">
                      <View className="bg-gray-800 rounded-full px-4 py-2 flex-row items-center gap-3">
                        <Text>💬</Text>
                        <Text className="text-white text-base font-PlusJakartaSansMedium">{profile.communicationStyle}</Text>
                      </View>
                    </View>
                  )}
                  {profile.financialStyle && (
                    <View className="w-1/2 px-1.5 mb-3">
                      <View className="bg-gray-800 rounded-full px-4 py-2 flex-row items-center gap-3">
                        <Text>💰</Text>
                        <Text className="text-white text-base font-PlusJakartaSansMedium">{profile.financialStyle}</Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* ══════════════════════════════════════════════════════
                 PERSONALITIES (traits — highlighted if mutual)
               ══════════════════════════════════════════════════════ */}
            {profile.personalities?.length > 0 && (
              <View className=" p-6 mx-3 mb-2" style={styles.boxContainer}>
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-[20px] font-PlusJakartaSansSemiBold text-primary">
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
            {renderSecondaryMedia(2, 1)}

            {/* ══════════════════════════════════════════════════════
                 EDUCATION & CAREER
                 (school, education level, occupation)
               ══════════════════════════════════════════════════════ */}
            {(profile.school || profile.education || profile.occupation) && (
              <View className=" p-5 mb-2 mx-3 rounded-2xl " style={styles.boxContainer}>
                <Text className="text-[20px] font-PlusJakartaSansSemiBold text-primary mb-3">
                  Education & Career
                </Text>
                <View style={{flex: 1}} className="flex-row flex-wrap gap-2">
                  {profile.school && (
                    <View className="bg-gray-800 flex-row items-center gap-2 px-4 py-2 rounded-full">
                      <Text>🏫</Text>
                      <Text className="text-white text-base font-PlusJakartaSansMedium">{profile.school}</Text>
                    </View>
                  )}
                  {profile.education && (
                    <View className="bg-gray-800 flex-row items-center gap-2 px-4 py-2 rounded-full">
                      <Text>🎓</Text>
                      <Text className="text-white text-base font-PlusJakartaSansMedium">{profile.education}</Text>
                    </View>
                  )}
                  {profile.occupation && (
                    <View className="bg-gray-800 flex-row items-center gap-2 px-4 py-2 rounded-full">
                      <Text>💼</Text>
                      <Text className="text-white text-base font-PlusJakartaSansMedium">{profile.occupation}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* ══════════════════════════════════════════════════════
                 LANGUAGES
               ══════════════════════════════════════════════════════ */}
            {profile.language?.length > 0 && (
              <View className=" p-5 mb-2 mx-3 rounded-2xl " style={styles.boxContainer}>
                <Text className="text-[20px] font-PlusJakartaSansSemiBold text-primary mb-3">
                  Languages
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {profile.language.map((lang, index) => (
                    <View key={index} className="bg-gray-800 flex-row items-center gap-2 px-4 py-2 rounded-full">
                      <Text>🗣️</Text>
                      <Text className="text-white text-base font-PlusJakartaSansMedium">{lang}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* ══════════════════════════════════════════════════════
                 BLOOD GROUP & GENOTYPE
               ══════════════════════════════════════════════════════ */}
            {(profile.bloodGroup || profile.genotype) && (
              <View className=" p-5 mb-2 mx-3 rounded-2xl " style={styles.boxContainer}>
                <Text className="text-[20px] font-PlusJakartaSansSemiBold text-primary mb-3">
                  Blood Group & Genotype
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {profile.bloodGroup && (
                    <View className="bg-gray-800 flex-row items-center gap-2 px-4 py-2 rounded-full">
                      <Text>🩸</Text>
                      <Text className="text-white text-base font-PlusJakartaSansMedium">{profile.bloodGroup}</Text>
                    </View>
                  )}
                  {profile.genotype && (
                    <View className="bg-gray-800 flex-row items-center gap-2 px-4 py-2 rounded-full">
                      <Text>🧬</Text>
                      <Text className="text-white text-base font-PlusJakartaSansMedium">{profile.genotype}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* ── Question 2 ── */}
            {profile.questions?.[1] && (
              <View className=" mb-2 p-5 mx-3 rounded-2xl border border-gray-600" style={styles.boxContainer}>
                <Text className="text-white font-PlusJakartaSans text-base">
                  {profile.questions[1].question}
                </Text>
                <Text className="text-white font-PlusJakartaSansBold text-2xl leading-relaxed">
                  {profile.questions[1].answer}
                </Text>
              </View>
            )}

            {/* ── Image 4 comment box ── */}
            {renderSecondaryMedia(3, 2)}

              {/* ── Question 3 ── */}
            {profile.questions?.[2] && (
              <View className=" mb-2 p-5 mx-3 rounded-2xl border border-gray-600" style={styles.boxContainer}>
                <Text className="text-white font-PlusJakartaSans text-base">
                  {profile.questions[2].question}
                </Text>
                <Text className="text-white font-PlusJakartaSansBold text-2xl leading-relaxed">
                  {profile.questions[2].answer}
                </Text>
              </View>
            )}

            {/* ── Interests — highlighted if mutual ── */}
            {profile.interests?.length > 0 && (
              <View className=" mb-2 p-5 mx-3 rounded-2xl " style={styles.boxContainer}>
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-[20px] font-PlusJakartaSansSemiBold text-primary">
                    Interests
                  </Text>
                  {profile.interests.some(isMutual) && (
                    <View className="border border-primary px-3 py-1 rounded-full">
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
            <View className=" mb-2 p-5 mx-3 rounded-2xl " style={styles.boxContainer}>
              <DirectMessageBox profile={profile} />
            </View>

            {/* ── Share / Block / Report ── */}
            <View className="flex-row justify-between gap-4 my-4">
              <TouchableOpacity
                style={{flex: 1}} className="p-5 justify-center items-center rounded-2xl"
                onPress={handleShare}
                activeOpacity={0.75}
              >
                <View className="w-16 h-16  flex-row justify-center items-center rounded-full shadow-sm" style={styles.boxContainer}>
                  <Share2 size={26} color="white" />
                </View>
                <Text className="mt-3 font-PlusJakartaSansMedium text-white">Share</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{flex: 1}} className="p-5 justify-center items-center rounded-2xl"
                onPress={openBlock}
                activeOpacity={0.75}
              >
                <View className="w-16 h-16 bg-red-50 flex-row justify-center items-center rounded-full" style={styles.boxContainer}>
                  <Ban size={26} color="#EF4444" />
                </View>
                <Text className="mt-3 font-PlusJakartaSansMedium text-red-500">Block</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{flex: 1}} className="p-5 justify-center items-center rounded-2xl"
                onPress={openReport}
                activeOpacity={0.75}
              >
                <View className="w-16 h-16 bg-orange-50 flex-row justify-center items-center rounded-full" style={styles.boxContainer}>
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

styles.mediaPreview = {
  marginHorizontal: 12,
  marginBottom: 8,
  borderRadius: 16,
  overflow: "hidden",
};

styles.mediaPreviewInner = {
  width: "100%",
  height: height * 0.55,
};