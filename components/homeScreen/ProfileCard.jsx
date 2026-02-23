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
  findNodeHandle,
  Text,
  TouchableOpacity,
  UIManager,
  View
} from "react-native";
import { Icons } from "../../constant/icons";
import { usePersistentUriCache } from "../../hooks/usePersistentUriCache";
import CommentBox from "../ui/CommentBox";
import DirectMessageBox from "../ui/DirectMessageBox";
import ProfileHeroSection from "./profileCard/ProfileHeroSection";
import ProfileImageModal from "./profileCard/ProfileImageModal";

const MAX_BIO_LENGTH = 120;
const { height } = Dimensions.get("window");
const FALLBACK_PROFILE_IMAGE = "https://via.placeholder.com/800x1200?text=No+Photo";

const ProfileCard = ({ profile }) => {
  const [showFullBio, setShowFullBio] = useState(false);
  const currentImageIndex = 0;
  const [modalVisible, setModalVisible] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const [imageLayouts, setImageLayouts] = useState({});
  const [visibleCommentBoxIndex, setVisibleCommentBoxIndex] = useState(null);
  const [scrollOffset, setScrollOffset] = useState(0);

  const scrollViewRef = useRef(null);
  const commentBoxRefs = useRef([]);

  const totalImages = profile?.images?.length || 1;
  const profileImages = useMemo(
    () => (Array.isArray(profile?.images) ? profile.images : []),
    [profile?.images]
  );
  const getImageUri = (index) => profileImages[index] || FALLBACK_PROFILE_IMAGE;

  const { isHydrated: isImageCacheHydrated, isUriCached, touchUri } =
    usePersistentUriCache({
      storageKey: "@bondify/cache/profile/imageUris",
      maxSize: 500,
    });

  const openImageModal = (index) => {
    setModalImageIndex(index);
    setModalVisible(true);
  };

  const closeImageModal = () => {
    setModalVisible(false);
  };

  // Handle scroll events to show/hide header and check comment box visibility
  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setScrollOffset(offsetY);
    checkCommentBoxVisibility(offsetY);
  };

  // Check which comment boxes should be visible based on scroll position
  const checkCommentBoxVisibility = useCallback((currentScrollOffset) => {
    if (!scrollViewRef.current) return;

    // Calculate visibility for each comment box
    const viewportTop = currentScrollOffset;
    const viewportBottom = currentScrollOffset + height;

    commentBoxRefs.current.forEach((ref, index) => {
      if (!ref) return;

      UIManager.measure(ref, (x, y, width, height, pageX, pageY) => {
        const elementTop = pageY;
        const elementBottom = pageY + height;

        // Check if element is in viewport (with some threshold)
        const isVisible =
          elementBottom > viewportTop + 200 &&
          elementTop < viewportBottom - 200;

        if (isVisible) {
          setVisibleCommentBoxIndex(index);
        } else if (visibleCommentBoxIndex === index) {
          setVisibleCommentBoxIndex(null);
        }
      });
    });
  }, [visibleCommentBoxIndex]);

  // Store layout information for each image
  const handleImageLayout = (index, event) => {
    const { y, height } = event.nativeEvent.layout;
    setImageLayouts((prev) => ({
      ...prev,
      [index]: { y, height },
    }));
  };

  // Store comment box refs
  const setCommentBoxRef = (index, ref) => {
    if (ref) {
      commentBoxRefs.current[index] = findNodeHandle(ref);
    }
  };

  useEffect(() => {
    // Initial check after layouts are set
    if (Object.keys(imageLayouts).length > 0) {
      checkCommentBoxVisibility(scrollOffset);
    }
  }, [checkCommentBoxVisibility, imageLayouts, scrollOffset]);

  if (!profile) return null;

  const isBioLong = profile.bio?.length > MAX_BIO_LENGTH;
  const displayedBio = showFullBio
    ? profile.bio
    : profile.bio?.slice(0, MAX_BIO_LENGTH) + (isBioLong ? "..." : "");

  return (
    <View className="relative ">
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
        <View className="">
          <ProfileHeroSection
            profile={profile}
            currentImageIndex={currentImageIndex}
            getImageUri={getImageUri}
            openImageModal={openImageModal}
            handleImageLayout={handleImageLayout}
            isImageCacheHydrated={isImageCacheHydrated}
            isUriCached={isUriCached}
            onMarkUriLoaded={touchUri}
          />

          <View className="py-6 ">
            {/* Mutual Connections */}
            {profile.mutualFriends > 0 && (
              <View className="bg-white -mt-20 pt-14 p-4 mb-2 rounded-t-2xl">
                <Text className="text-app text-[20px] font-GeneralSansSemiBold">
                  Shared interests
                </Text>

                {profile.mutualInterests.length > 0 && (
                  <View className="flex flex-row flex-wrap gap-2 mt-2">
                    {profile.mutualInterests.map((interest, index) => (
                      <View
                        key={index}
                        className="bg-primary/20   px-4 py-2 rounded-full"
                      >
                        <Text className="text-primary text-[16px] font-Satoshi">
                          {interest}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Looking For */}
            {profile.lookingFor && (
              <View className="bg-white  p-4 mb-2">
                <View className="flex-row items-center mb-2">
                  <Text className="text-[20px] font-GeneralSansSemiBold text-app">
                    Looking for
                  </Text>
                </View>

                <View className="self-start items-center justify-center bg-gray-100   px-5 py-2 rounded-full">
                  <Text className="text-black text-[16px] font-Satoshi">
                    {profile.lookingFor}
                  </Text>
                </View>
              </View>
            )}

            {/* Bio */}
            {profile.bio && (
              <View className="bg-white  mb-2 p-6 ">
                <View className="flex-row items-center mb-3">
                  <Text className="text-[20px] font-GeneralSansSemiBold text-app">
                    Bio
                  </Text>
                </View>
                <Text className="text-app font-Satoshi text-[16px] ">
                  {displayedBio}
                </Text>
                {isBioLong && (
                  <TouchableOpacity
                    onPress={() => setShowFullBio(!showFullBio)}
                  >
                    <Text className="text-primary mt-1 font-medium">
                      {showFullBio ? "Show less" : "Read more"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* First question after bio */}
            {profile.questions?.[0] && (
              <View className="bg-white p-5 rounded-xl">
                <Text className="text-app font-Satoshi text-base mb-2">
                  {profile.questions[0].question}
                </Text>
                <Text className="text-app font-SatoshiBold text-2xl leading-relaxed">
                  {profile.questions[0].answer}
                </Text>
              </View>
            )}

            {/* First additional image with comment indicator */}
            <View ref={(ref) => setCommentBoxRef(0, ref)}>
              <CommentBox
                imageUri={profile?.images?.[1]}
                index={1}
                onPress={() => openImageModal(1)}
                onSendMessage={(message, idx) => {
                  console.log("Send message for image", idx, message);
                }}
                showComposer={visibleCommentBoxIndex === 0}
              />
            </View>

            {/* Essentials */}
            <View className="bg-white p-6 mb-2">
              <View className="flex-row items-center mb-4">
                <Text className="text-[20px] font-GeneralSansSemiBold text-app ml-2">
                  Essentials
                </Text>
              </View>

              {/* Two-column grid layout */}
              <View className="flex-row flex-wrap -mx-1.5">
                {profile.distance && (
                  <View className="w-1/2 px-1.5 mb-3">
                    <View className="bg-gray-100  rounded-full px-4 py-2 flex-row items-center gap-3">
                      <MapPin color={"black"} size={18} />
                      <Text className="text-app  text-base font-GeneralSansMedium">
                        {profile.distance}
                      </Text>
                    </View>
                  </View>
                )}

                {profile.occupation && (
                  <View className="w-1/2 px-1.5 mb-3">
                    <View className="bg-gray-100 rounded-full px-4 py-2 flex-row items-center gap-3">
                      <Briefcase color={"black"} size={18} />
                      <Text className="text-app  text-base font-GeneralSansMedium">
                        {profile.occupation}
                      </Text>
                    </View>
                  </View>
                )}

                {profile.height && (
                  <View className="w-1/2 px-1.5 mb-3">
                    <View className="bg-gray-100  rounded-full px-4 py-2 flex-row items-center gap-3">
                      <Ruler color={"black"} size={18} />
                      <Text className="text-app  text-base font-GeneralSansMedium">
                        {profile.height}
                      </Text>
                    </View>
                  </View>
                )}

                {profile.religion && (
                  <View className="w-1/2 px-1.5 mb-3">
                    <View className="bg-gray-100  rounded-full px-4 py-2 flex-row items-center gap-3">
                      <MaterialCommunityIcons
                        name="hands-pray"
                        size={20}
                        color={"black"}
                      />
                      <Text className="text-app  text-base font-GeneralSansMedium">
                        {profile.religion}
                      </Text>
                    </View>
                  </View>
                )}

                {profile.drinking && (
                  <View className="w-1/2 px-1.5 mb-3">
                    <View className="bg-gray-100  rounded-full px-4 py-2 flex-row items-center gap-3">
                      <Wine color={"black"} size={18} />
                      <Text className="text-app  text-base font-GeneralSansMedium">
                        {profile.drinking}
                      </Text>
                    </View>
                  </View>
                )}

                {profile.smoking && (
                  <View className="w-1/2 px-1.5 mb-3">
                    <View className="bg-gray-100  rounded-full px-4 py-2 flex-row items-center gap-3">
                      <Cigarette color={"black"} size={18} />
                      <Text className=" text-base font-GeneralSansMedium">
                        {profile.smoking}
                      </Text>
                    </View>
                  </View>
                )}

                {profile.children && (
                  <View className="w-1/2 px-1.5 mb-3">
                    <View className="bg-gray-100  rounded-full px-4 py-2 flex-row items-center gap-3">
                      <Baby color={"black"} size={18} />
                      <Text className="text-app  text-base font-GeneralSansMedium">
                        {profile.children}
                      </Text>
                    </View>
                  </View>
                )}

                {profile.pets && (
                  <View className="w-1/2 px-1.5 mb-3">
                    <View className="bg-gray-100  rounded-full px-4 py-2 flex-row items-center gap-3">
                      <Dog color={"black"} size={18} />
                      <Text className="text-app  text-base font-GeneralSansMedium">
                        {profile.pets}
                      </Text>
                    </View>
                  </View>
                )}

                {profile.exercise && (
                  <View className="w-1/2 px-1.5 mb-3">
                    <View className="bg-gray-100  rounded-full px-4 py-2 flex-row items-center gap-3">
                      <Dumbbell color={"black"} size={18} />
                      <Text className="text-app text-base font-GeneralSansMedium">
                        {profile.exercise}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* Basics */}
            <View className="bg-white p-6 mb-2">
              <View className="flex-row items-center mb-4">
                <Text className="text-[20px] font-GeneralSansSemiBold text-app ml-2">
                  Basics
                </Text>
              </View>

              {/* Two-column grid layout */}
              <View className="flex-row flex-wrap -mx-1.5">
                {profile.zodiac && (
                  <View className="w-1/2 px-1.5 mb-3">
                    <View className="bg-gray-100 rounded-full px-4 py-2 flex-row items-center gap-3">
                      <Image source={Icons.zodiacSign} />
                      <Text className="text-app  text-base font-GeneralSansMedium">
                        {profile.zodiac}
                      </Text>
                    </View>
                  </View>
                )}

                {profile.loveStyle && (
                  <View className="w-1/2 px-1.5 mb-3">
                    <View className="bg-gray-100  rounded-full px-4 py-2 flex-row items-center gap-3">
                      <Heart color={"black"} size={18} />
                      <Text className="text-app  text-base font-GeneralSansMedium">
                        {profile.loveStyle}
                      </Text>
                    </View>
                  </View>
                )}

                {profile.communicationStyle && (
                  <View className="w-1/2 px-1.5 mb-3">
                    <View className="bg-gray-100  rounded-full px-4 py-2 flex-row items-center gap-3">
                      <Heart color={"black"} size={18} />
                      <Text className="text-app  text-base font-GeneralSansMedium">
                        {profile.communicationStyle}
                      </Text>
                    </View>
                  </View>
                )}

                {profile.financialStyle && (
                  <View className="w-1/2 px-1.5 mb-3">
                    <View className="bg-gray-100  rounded-full px-4 py-2 flex-row items-center gap-3">
                      <Wallet size={20} color={"black"} />
                      <Text className="text-app  text-base font-GeneralSansMedium">
                        {profile.financialStyle}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* Personalities */}
            {profile.personalities?.length > 0 && (
              <View className=" bg-white  p-6 ">
                <View className="flex-row items-center mb-3">
                  <Text className="text-[20px] font-GeneralSansSemiBold text-app">
                    Personalities
                  </Text>
                </View>
                <View className="flex-row flex-wrap">
                  {profile.personalities.map((personality, index) => (
                    <View
                      key={index}
                      className={`rounded-full  px-4 py-2 mr-2 mb-2 
                        
                           bg-gray-100 
                      }`}
                    >
                      <Text
                        className={`font-SatoshiMedium 
                           text-black
                        }`}
                      >
                        {personality}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Second additional image with comment indicator */}
            <View ref={(ref) => setCommentBoxRef(1, ref)}>
              <CommentBox
                imageUri={profile?.images?.[2]}
                index={2}
                onPress={() => openImageModal(2)}
                onSendMessage={(message, idx) => {
                  console.log("Send message for image", idx, message);
                }}
                showComposer={visibleCommentBoxIndex === 1}
              />
            </View>

            {/* Education */}
            {profile.school && (
              <View className="bg-white  mb-2 p-6 ">
                <View className="flex-row items-center mb-3  ">
                  <Text className="text-[20px] font-GeneralSansSemiBold text-app">
                    School and education
                  </Text>
                </View>
                <View className="flex-1 flex-row flex-wrap gap-2 ">
                  <View className="bg-gray-100  flex-row items-center gap-2 px-4 py-2 rounded-full">
                    <GraduationCap color={"black"} size={18} />
                    <Text className="text-app  text-base font-GeneralSansMedium">
                      {profile.school}
                    </Text>
                  </View>
                  <View className="bg-gray-100  flex-row items-center gap-2 px-4 py-2 rounded-full">
                    <GraduationCap color={"black"} size={18} />
                    <Text className="text-app  text-base font-GeneralSansMedium">
                      {profile.education}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Languages */}
            {profile.language && profile.language.length > 0 && (
              <View className="bg-white mb-2 p-6">
                <View className="flex-row items-center mb-3">
                  <Text className="text-[20px] font-GeneralSansSemiBold text-app">
                    Languages and ethnicity
                  </Text>
                </View>

                <View className="flex-row flex-wrap gap-2">
                  {profile.language.map((lang, index) => (
                    <View
                      key={index}
                      className="bg-gray-100  flex-row items-center gap-2 px-4 py-2 rounded-full"
                    >
                      <Text className="text-app text-base font-GeneralSansMedium">
                        {lang}
                      </Text>
                    </View>
                  ))}
                </View>

                {profile.nationality && (
                  <View className="mt-2">
                    <View className="flex-1 flex-row flex-wrap gap-2 ">
                      <View className="bg-gray-100  flex-row items-center gap-2 px-4 py-2 rounded-full">
                        <Text className="text-app  text-base font-GeneralSansMedium">
                          {profile.nationality}
                        </Text>
                      </View>
                      <View className="bg-gray-100  flex-row items-center gap-2 px-4 py-2 rounded-full">
                        <Text className="text-app  text-base font-GeneralSansMedium">
                          {profile.ethnicity}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            )}
            {/* Another question later */}
            {profile.questions?.[2] && (
              <View className="bg-white  p-5 rounded-xl">
                <Text className="text-app font-Satoshi text-base mb-2">
                  {profile.questions[1].question}
                </Text>
                <Text className="text-app font-SatoshiBold text-2xl leading-relaxed">
                  {profile.questions[1].answer}
                </Text>
              </View>
            )}

            {/* Third additional image with comment indicator */}
            <View ref={(ref) => setCommentBoxRef(2, ref)}>
              <CommentBox
                imageUri={profile?.images?.[3]}
                index={3}
                onPress={() => openImageModal(3)}
                onSendMessage={(message, idx) => {
                  console.log("Send message for image", idx, message);
                }}
                showComposer={visibleCommentBoxIndex === 2}
              />
            </View>

            {/* Another question later */}
            {profile.questions?.[2] && (
              <View className="bg-white mb-2 p-5 rounded-xl">
                <Text className="text-app font-Satoshi text-base mb-2">
                  {profile.questions[1].question}
                </Text>
                <Text className="text-app font-SatoshiBold text-2xl leading-relaxed">
                  {profile.questions[1].answer}
                </Text>
              </View>
            )}

            {/* Interests */}
            {profile.interests?.length > 0 && (
              <View className="mb-3 bg-white  p-6 ">
                <View className="flex-row items-center mb-3">
                  <Text className="text-[20px] font-GeneralSansSemiBold text-app">
                    Interests
                  </Text>
                </View>
                <View className="flex-row flex-wrap">
                  {profile.interests.map((interest, index) => (
                    <View
                      key={index}
                      className={`rounded-full  px-4 py-2 mr-2 mb-2 ${
                        profile.mutualInterests?.includes(interest)
                          ? "bg-secondary "
                          : "bg-gray-100 "
                      }`}
                    >
                      <Text
                        className={`font-SatoshiMedium ${
                          profile.mutualInterests?.includes(interest)
                            ? "text-primary"
                            : "text-black"
                        }`}
                      >
                        {interest}
                        {profile.mutualInterests?.includes(interest)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Final Comment Section at End */}
            <DirectMessageBox profile={profile} />

            {/* Buttons */}
            <View className="flex-row justify-between gap-4 my-4">
              {/* Share */}
              <View className="flex-1 p-5  justify-center items-center rounded-2xl">
                <View className="w-16 h-16 bg-white flex-row justify-center items-center rounded-full">
                  <Share2 size={26} color="black" />
                </View>
                <Text className="mt-3 font-SatoshiMedium">Share</Text>
              </View>

              <View className="flex-1 p-5  justify-center items-center rounded-2xl">
                <View className="w-16 h-16 bg-white flex-row justify-center items-center rounded-full">
                  <Ban size={26} color="black" />
                </View>

                <Text className="mt-3 font-SatoshiMedium">Block</Text>
              </View>

              <View className="flex-1 p-5  justify-center items-center rounded-2xl">
                <View className="w-16 h-16 bg-white flex-row justify-center items-center rounded-full">
                  <Flag size={26} color="black" />
                </View>

                <Text className="mt-3 font-SatoshiMedium">Report</Text>
              </View>
            </View>
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
};

export default ProfileCard;
