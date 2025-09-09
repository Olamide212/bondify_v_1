import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  TouchableWithoutFeedback,
  Pressable,
  Modal,
  Animated,
  TextInput,
  ScrollView as RNScrollView,
  findNodeHandle,
  UIManager,
} from "react-native";
import { Image } from "expo-image";
import {
  Star,
  ChevronLeft,
  MapPin,
  Briefcase,
  GraduationCap,
  Ruler,
  Wine,
  Cigarette,
  Dog,
  Dumbbell,
  Info,
  User,
  Baby,
  Sparkles,
  X,
  Wallet,
  Heart,
  Ban,
  ChevronRight,
  ChevronLeft as LeftIcon,
  MessageCircle,
  SendHorizonal as PaperPlane,
} from "lucide-react-native";
import { colors } from "../../constant/colors";
import { useRouter } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Share2, Slash, Flag } from "lucide-react-native";
import CommentBox from "../ui/CommentBox";
import DirectMessageBox from "../ui/DirectMessageBox";
import { Icons } from "../../constant/icons";

const MAX_BIO_LENGTH = 120;
const { width, height } = Dimensions.get("window");

const ProfileCard = ({ profile }) => {
  const [showFullBio, setShowFullBio] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const [showHeader, setShowHeader] = useState(false);
  const [imageLayouts, setImageLayouts] = useState({});
  const [visibleCommentBoxIndex, setVisibleCommentBoxIndex] = useState(null);
  const [scrollOffset, setScrollOffset] = useState(0);

  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef(null);
  const commentBoxRefs = useRef([]);

  const totalImages = profile?.images?.length || 1;
  const router = useRouter();

  // Animation values for comment indicators
  const commentAnimations = useRef(
    profile?.images?.map(() => new Animated.Value(0)) || []
  ).current;

  const goNext = () => {
    setCurrentImageIndex((prev) => (prev + 1) % totalImages);
  };

  const goPrev = () => {
    setCurrentImageIndex((prev) => (prev - 1 + totalImages) % totalImages);
  };

  const handlePress = (e) => {
    const pressX = e.nativeEvent.locationX;
    if (pressX > width / 2) {
      goNext();
    } else {
      goPrev();
    }
  };

  const openImageModal = (index) => {
    setModalImageIndex(index);
    setModalVisible(true);
  };

  const closeImageModal = () => {
    setModalVisible(false);
  };

  const goNextModal = () => {
    setModalImageIndex((prev) => (prev + 1) % totalImages);
  };

  const goPrevModal = () => {
    setModalImageIndex((prev) => (prev - 1 + totalImages) % totalImages);
  };

  // Handle scroll events to show/hide header and check comment box visibility
  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setScrollOffset(offsetY);
    setShowHeader(offsetY > 100);
    checkCommentBoxVisibility(offsetY);
  };

  // Check which comment boxes should be visible based on scroll position
  const checkCommentBoxVisibility = (scrollOffset) => {
    if (!scrollViewRef.current) return;

    // Calculate visibility for each comment box
    const viewportTop = scrollOffset;
    const viewportBottom = scrollOffset + height;

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
  };

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
  }, [imageLayouts, scrollOffset]);

  if (!profile) return null;

  const isBioLong = profile.bio?.length > MAX_BIO_LENGTH;
  const displayedBio = showFullBio
    ? profile.bio
    : profile.bio?.slice(0, MAX_BIO_LENGTH) + (isBioLong ? "..." : "");

  return (
    <View className="relative ">
      {/* Image Modal */}
      <Modal
        visible={modalVisible}
        transparent={false}
        onRequestClose={closeImageModal}
        animationType="fade"
      >
        <View className="flex-1 bg-black">
          <Pressable
            className="absolute top-14 right-6 z-50 bg-black/50 rounded-full p-2"
            onPress={closeImageModal}
          >
            <X color="white" size={24} />
          </Pressable>

          <View className="flex-1 justify-center">
            <Image
              source={{ uri: profile?.images?.[modalImageIndex] }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
            />

            {modalImageIndex > 0 && (
              <Pressable
                className="absolute left-4 bg-black/50 rounded-full p-3"
                onPress={goPrevModal}
              >
                <LeftIcon color="white" size={28} />
              </Pressable>
            )}

            {modalImageIndex < totalImages - 1 && (
              <Pressable
                className="absolute right-4 bg-black/50 rounded-full p-3"
                onPress={goNextModal}
              >
                <ChevronRight color="white" size={28} />
              </Pressable>
            )}
          </View>

          <View className="absolute bottom-10 left-0 right-0 flex-row justify-center">
            {profile.images.map((_, index) => (
              <View
                key={index}
                className={`h-2 w-2 rounded-full mx-1 ${
                  index === modalImageIndex ? "bg-white" : "bg-gray-400"
                }`}
              />
            ))}
          </View>
        </View>
      </Modal>

      <Animated.ScrollView
        ref={scrollViewRef}
        contentContainerStyle={{ paddingBottom: 80 }}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
      >
        <View className="">
          {/* Make the main image clickable */}
          <Pressable onPress={() => openImageModal(currentImageIndex)}>
            <View
              onLayout={(e) => handleImageLayout(0, e)}
              className=" shadow-lg overflow-hidden bg-white"
              style={{
                width: "100%",
                height: 760,
              }}
            >
              <TouchableWithoutFeedback
                onPress={() => openImageModal(currentImageIndex)}
              >
                <View className="relative  w-full">
                  <Image
                    source={{ uri: profile?.images?.[currentImageIndex] }}
                    className="w-full h-full"
                    contentFit="cover"
                    style={{
                      width: "100%",
                      height: 900,
                    }}
                  />

                  <View className="absolute bottom-72 left-6 right-6">
                    <View className="flex-row items-center mb-2">
                      <Text className="text-white text-4xl font-SatoshiBold mr-2">
                        {profile.name}
                      </Text>

                      <View className="flex-row gap-2">
                        <Text className="text-white text-4xl font-Satoshi">
                          {profile.age}
                        </Text>
                        {profile.verified && (
                          <View>
                            <Image
                              source={require("../../assets/icons/verified-icon.png")}
                              style={{ width: 23, height: 23 }}
                              contentFit="contain"
                            />
                          </View>
                        )}
                      </View>
                    </View>

                    <View className="flex-row items-center flex-wrap gap-x-4 gap-y-4">
                      {profile.lastActive && (
                        <View className="flex-row items-center bg-primary px-4 py-2 rounded-full">
                          <View className="w-3 h-3 bg-secondary rounded-full" />
                          <Text className="text-white font-SatoshiMedium ml-2 capitalize">
                            {profile.lastActive}
                          </Text>
                        </View>
                      )}
                      {profile.occupation && (
                        <View className="flex-row items-center bg-white px-4 py-2 rounded-full">
                          <Briefcase size={18} color="#000" />
                          <Text className="text-black font-SatoshiMedium ml-2 capitalize">
                            {profile.occupation}
                          </Text>
                        </View>
                      )}
                      {profile.religion && (
                        <View className="flex-row items-center bg-white px-4 py-2 rounded-full">
                          <MaterialCommunityIcons
                            name="hands-pray"
                            size={20}
                            color={"black"}
                          />
                          <Text className="text-black font-SatoshiMedium ml-2 capitalize">
                            {profile.religion}
                          </Text>
                        </View>
                      )}

                      {profile.location && (
                        <View className="flex-row items-center bg-white px-4 py-2 rounded-full">
                          <MapPin size={18} color="#000" />
                          <Text className="text-black font-SatoshiMedium ml-2">
                            {profile.distance}, {profile.location}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </Pressable>

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
                        className="bg-gray-100  px-4 py-2 rounded-full"
                      >
                        <Text className="text-black text-[16px] font-Satoshi">
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
