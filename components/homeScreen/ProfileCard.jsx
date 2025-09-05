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
  Ban,
  ChevronRight,
  ChevronLeft as LeftIcon,
  MessageCircle,
  SendHorizonal as PaperPlane,
} from "lucide-react-native";
import { colors } from "../../constant/colors";
import { useRouter } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { ScrollView } from "react-native-gesture-handler";
import CommentButton from "../ui/CommentButton";
import { Share2, Slash, Flag } from "lucide-react-native";
import CommentBox from "../ui/CommentBox";
import DirectMessageBox from "../ui/DirectMessageBox"

const MAX_BIO_LENGTH = 120;
const { width } = Dimensions.get("window");

const ProfileCard = ({ profile }) => {
  const [showFullBio, setShowFullBio] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const [showHeader, setShowHeader] = useState(false);
  const [imageLayouts, setImageLayouts] = useState({});

  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef(null);

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

  // // Handle scroll events to show/hide header
  // const handleScroll = Animated.event(
  //   [{ nativeEvent: { contentOffset: { y: scrollY } } }],
  //   {
  //     listener: (event) => {
  //       const offsetY = event.nativeEvent.contentOffset.y;
  //       setShowHeader(offsetY > 100);
  //       checkVisibleImages(offsetY);
  //     },
  //     useNativeDriver: false,
  //   }
  // );

  // Store layout information for each image
  const handleImageLayout = (index, event) => {
    const { y, height } = event.nativeEvent.layout;
    setImageLayouts((prev) => ({
      ...prev,
      [index]: { y, height },
    }));
  };

  // // Check which images are visible based on scroll position
  // const checkVisibleImages = (scrollOffset) => {
  //   const screenHeight = Dimensions.get("window").height;

  //   Object.entries(imageLayouts).forEach(([index, layout]) => {
  //     const imageY = layout.y - scrollOffset;
  //     const imageBottom = imageY + layout.height;

  //     // Image is visible if any part is in the viewport
  //     const isVisible = imageBottom > 100 && imageY < screenHeight - 100;

  //     if (isVisible) {
  //       // Animate in the comment indicator
  //       Animated.timing(commentAnimations[index], {
  //         toValue: 1,
  //         duration: 500,
  //         useNativeDriver: true,
  //       }).start();
  //     } else {
  //       // Animate out the comment indicator
  //       Animated.timing(commentAnimations[index], {
  //         toValue: 0,
  //         duration: 300,
  //         useNativeDriver: true,
  //       }).start();
  //     }
  //   });
  // };

  if (!profile) return null;

  const isBioLong = profile.bio?.length > MAX_BIO_LENGTH;
  const displayedBio = showFullBio
    ? profile.bio
    : profile.bio?.slice(0, MAX_BIO_LENGTH) + (isBioLong ? "..." : "");

  // Animated header background

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

          <Animated.View
            className="absolute bottom-6 right-6"
            style={{
              opacity:
                commentAnimations[modalImageIndex] || new Animated.Value(1),
            }}
          >
            <TouchableOpacity className="bg-white/90 rounded-full p-3 flex-row items-center">
              <MessageCircle size={20} color={colors.primary} />
              <Text className="text-primary font-SatoshiMedium ml-2">
                Comment
              </Text>
            </TouchableOpacity>
          </Animated.View>

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

      {/* Fixed Back Icon */}

      <Animated.ScrollView
        ref={scrollViewRef}
        contentContainerStyle={{ paddingBottom: 80 }}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
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
                      <Text className="text-white text-3xl font-SatoshiBold mr-2">
                        {profile.name}
                      </Text>

                      <View className="flex-row gap-2">
                        <Text className="text-white text-3xl font-Satoshi">
                          {profile.age}
                        </Text>
                        {profile.verified && (
                          <View>
                            <Image
                              source={require("../../assets/icons/verified-1.png")}
                              style={{ width: 23, height: 23 }}
                              contentFit="contain"
                            />
                          </View>
                        )}
                      </View>
                    </View>

                    <View className="flex-row items-center flex-wrap gap-x-6 gap-y-2">
                      {profile.occupation && (
                        <View className="flex-row items-center">
                          <Briefcase size={18} color="white" />
                          <Text className="text-white font-SatoshiMedium ml-2 capitalize">
                            {profile.occupation}
                          </Text>
                        </View>
                      )}

                      {profile.location && (
                        <View className="flex-row items-center">
                          <GraduationCap size={18} color="white" />
                          <Text className="text-white font-SatoshiMedium ml-2">
                            {profile.distance}, {profile.location}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <Animated.View
                    className="absolute bottom-4 right-4"
                    style={{
                      opacity: commentAnimations[0],
                      transform: [
                        {
                          translateY: commentAnimations[0].interpolate({
                            inputRange: [0, 1],
                            outputRange: [20, 0],
                          }),
                        },
                      ],
                    }}
                  >
                    <TouchableOpacity className="bg-white/90 rounded-full p-3 flex-row items-center">
                      <MessageCircle size={20} color={colors.primary} />
                      <Text className="text-primary font-SatoshiMedium ml-2">
                        Comment
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
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
                        className="bg-gray-100 border border-[#D1D1D1] px-4 py-2 rounded-full"
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

                <View className="self-start items-center justify-center bg-gray-100 border border-[#D1D1D1] px-5 py-2 rounded-full">
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

            {/* Essentials */}
            <View className="bg-white p-6 mb-2">
              <View className="flex-row items-center mb-4">
                <Text className="text-[20px] font-GeneralSansSemiBold text-app ml-2">
                  About me
                </Text>
              </View>

              {/* Two-column grid layout */}
              <View className="flex-row flex-wrap -mx-1.5">
                {profile.distance && (
                  <View className="w-1/2 px-1.5 mb-3">
                    <View className="bg-gray-100 border border-[#D1D1D1] rounded-full px-4 py-2 flex-row items-center gap-3">
                      <MapPin color={"black"} size={18} />
                      <Text className="text-app  text-base font-GeneralSansMedium">
                        {profile.distance}
                      </Text>
                    </View>
                  </View>
                )}

                {profile.occupation && (
                  <View className="w-1/2 px-1.5 mb-3">
                    <View className="bg-gray-100 border border-[#D1D1D1] rounded-full px-4 py-2 flex-row items-center gap-3">
                      <Briefcase color={"black"} size={18} />
                      <Text className="text-app  text-base font-GeneralSansMedium">
                        {profile.occupation}
                      </Text>
                    </View>
                  </View>
                )}

                {profile.height && (
                  <View className="w-1/2 px-1.5 mb-3">
                    <View className="bg-gray-100 border border-[#D1D1D1] rounded-full px-4 py-2 flex-row items-center gap-3">
                      <Ruler color={"black"} size={18} />
                      <Text className="text-app  text-base font-GeneralSansMedium">
                        {profile.height}
                      </Text>
                    </View>
                  </View>
                )}

                {profile.religion && (
                  <View className="w-1/2 px-1.5 mb-3">
                    <View className="bg-gray-100 border border-[#D1D1D1] rounded-full px-4 py-2 flex-row items-center gap-3">
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
                    <View className="bg-gray-100 border border-[#D1D1D1] rounded-full px-4 py-2 flex-row items-center gap-3">
                      <Wine color={"black"} size={18} />
                      <Text className="text-app  text-base font-GeneralSansMedium">
                        {profile.drinking}
                      </Text>
                    </View>
                  </View>
                )}

                {profile.smoking && (
                  <View className="w-1/2 px-1.5 mb-3">
                    <View className="bg-gray-100 border border-[#D1D1D1] rounded-full px-4 py-2 flex-row items-center gap-3">
                      <Cigarette color={"black"} size={18} />
                      <Text className=" text-base font-GeneralSansMedium">
                        {profile.smoking}
                      </Text>
                    </View>
                  </View>
                )}

                {profile.children && (
                  <View className="w-1/2 px-1.5 mb-3">
                    <View className="bg-gray-100 border border-[#D1D1D1] rounded-full px-4 py-2 flex-row items-center gap-3">
                      <Baby color={"black"} size={18} />
                      <Text className="text-app  text-base font-GeneralSansMedium">
                        {profile.children}
                      </Text>
                    </View>
                  </View>
                )}

                {profile.pets && (
                  <View className="w-1/2 px-1.5 mb-3">
                    <View className="bg-gray-100 border border-[#D1D1D1] rounded-full px-4 py-2 flex-row items-center gap-3">
                      <Dog color={"black"} size={18} />
                      <Text className="text-app  text-base font-GeneralSansMedium">
                        {profile.pets}
                      </Text>
                    </View>
                  </View>
                )}

                {profile.exercise && (
                  <View className="w-1/2 px-1.5 mb-3">
                    <View className="bg-gray-100 border border-[#D1D1D1] rounded-full px-4 py-2 flex-row items-center gap-3">
                      <Dumbbell color={"black"} size={18} />
                      <Text className="text-app text-base font-GeneralSansMedium">
                        {profile.exercise}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* First additional image with comment indicator */}

            <CommentBox
              imageUri={profile?.images?.[1]}
              index={1}
              onPress={() => openImageModal(1)}
              onSendMessage={(message, idx) => {
                console.log("Send message for image", idx, message);
                // TODO: call your API to send message
              }}
              onSendAudio={(audioUri, idx) => {
                console.log("Send audio for image", idx, audioUri);
                // TODO: upload the audio file & link to profile/image
              }}
            />

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
                      className={`rounded-full border px-4 py-2 mr-2 mb-2 ${
                        profile.mutualInterests?.includes(interest)
                          ? "bg-pink-50 border border-primary"
                          : "bg-gray-100 border-[#D1D1D1]"
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

            {/* Personalities */}
            {profile.personalities?.length > 0 && (
              <View className="mb-2 bg-white  p-6 ">
                <View className="flex-row items-center mb-3">
                  <Text className="text-[20px] font-GeneralSansSemiBold text-app">
                    Personalities
                  </Text>
                </View>
                <View className="flex-row flex-wrap">
                  {profile.personalities.map((personality, index) => (
                    <View
                      key={index}
                      className={`rounded-full border px-4 py-2 mr-2 mb-2 
                        
                           bg-gray-100 border-[#D1D1D1]
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

            {/* Education */}
            {profile.school && (
              <View className="bg-white  mb-2 p-6 ">
                <View className="flex-row items-center mb-3  ">
                  <Text className="text-[20px] font-GeneralSansSemiBold text-app">
                    School and education
                  </Text>
                </View>
                <View className="flex-1 flex-row flex-wrap gap-2 ">
                  <View className="bg-gray-100 border border-[#D1D1D1] flex-row items-center gap-2 px-4 py-2 rounded-full">
                    <GraduationCap color={"black"} size={18} />
                    <Text className="text-app  text-base font-GeneralSansMedium">
                      {profile.school}
                    </Text>
                  </View>
                  <View className="bg-gray-100 border border-[#D1D1D1] flex-row items-center gap-2 px-4 py-2 rounded-full">
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
                      className="bg-gray-100 border border-[#D1D1D1] flex-row items-center gap-2 px-4 py-2 rounded-full"
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
                      <View className="bg-gray-100 border border-[#D1D1D1] flex-row items-center gap-2 px-4 py-2 rounded-full">
                        <Text className="text-app  text-base font-GeneralSansMedium">
                          {profile.nationality}
                        </Text>
                      </View>
                      <View className="bg-gray-100 border border-[#D1D1D1] flex-row items-center gap-2 px-4 py-2 rounded-full">
                        <Text className="text-app  text-base font-GeneralSansMedium">
                          {profile.ethnicity}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Second additional image with comment indicator */}
            <CommentBox
              imageUri={profile?.images?.[2]}
              index={1}
              onPress={() => openImageModal(2)}
              onSendMessage={(message, idx) => {
                console.log("Send message for image", idx, message);
                // TODO: call your API to send message
              }}
              onSendAudio={(audioUri, idx) => {
                console.log("Send audio for image", idx, audioUri);
                // TODO: upload the audio file & link to profile/image
              }}
            />

            {/* Questions */}
            <>
              {profile.questions?.length > 0 &&
                profile.questions.map((item, index) => (
                  <View key={index} className="bg-white  mb-2 p-5 ">
                    <Text className="text-app font-Satoshi text-base mb-2">
                      {item.question}
                    </Text>
                    <Text className="text-app font-SatoshiBold text-2xl leading-relaxed">
                      {item.answer}
                    </Text>
                  </View>
                ))}
            </>

            {/* First additional image with comment indicator */}
            <CommentBox
              imageUri={profile?.images?.[3]}
              index={1}
              onPress={() => openImageModal(3)}
              onSendMessage={(message, idx) => {
                console.log("Send message for image", idx, message);
                // TODO: call your API to send message
              }}
              onSendAudio={(audioUri, idx) => {
                console.log("Send audio for image", idx, audioUri);
                // TODO: upload the audio file & link to profile/image
              }}
            />

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
