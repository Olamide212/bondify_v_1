import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  TouchableWithoutFeedback,
  Pressable,
} from "react-native";
import { Image } from "expo-image";
import {
  Star,
  ChevronLeft ,
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
} from "lucide-react-native";
import { colors } from "../../constant/colors";
import { useRouter } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { ScrollView } from "react-native-gesture-handler";
import CommentButton from "../ui/CommentButton";

const MAX_BIO_LENGTH = 120;
const { width } = Dimensions.get("window");

const ProfileCard = ({ profile }) => {
  const [showFullBio, setShowFullBio] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const totalImages = profile?.images?.length || 1;
  const router = useRouter();

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

  if (!profile) return null;

  const isBioLong = profile.bio?.length > MAX_BIO_LENGTH;
  const displayedBio = showFullBio
    ? profile.bio
    : profile.bio?.slice(0, MAX_BIO_LENGTH) + (isBioLong ? "..." : "");

  return (
    <View className="relative ">
      {/* Fixed Back Icon */}

      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        <View>
          <Pressable
            className="absolute top-16 left-6 bg-black/40 rounded-full p-3 z-50"
            onPress={() => router.back()}
          >
            <ChevronLeft color="white" size={20} />
          </Pressable>
        </View>

        <View className="">
          <View
            className=" shadow-lg overflow-hidden bg-white"
            style={{
              width: "100%",
              height: 600,
              borderBottomLeftRadius: 30,
              borderBottomRightRadius: 30,
            }}
          >
            <TouchableWithoutFeedback onPress={handlePress}>
              <View className="relative h-[600px] w-full">
                <Image
                  source={{ uri: profile?.images?.[1] }}
                  className="w-full h-full"
                  contentFit="cover"
                  style={{
                    width: "100%",
                    height: 600,
                    borderBottomLeftRadius: 30,
                    borderBottomRightRadius: 30,
                  }}
                />

                <View
                  className="absolute inset-0 bg-black/20 rounded-b-3xl"
                  style={{
                    width: "100%",
                    height: 600,
                    borderBottomLeftRadius: 30,
                    borderBottomRightRadius: 30,
                  }}
                />

                <View className="absolute bottom-6 left-6 right-6">
                  <View className="flex-row items-center mb-2">
                    <Text className="text-white text-3xl font-SatoshiBold mr-2">
                      {profile.name}
                    </Text>
                    <Text className="text-white text-3xl font-Satoshi">
                      {profile.age}
                    </Text>
                  </View>

                  <View className="flex-row items-center flex-wrap gap-x-6 gap-y-2">
                    {profile.occupation && (
                      <View className="flex-row items-center">
                        <Briefcase size={16} color="white" />
                        <Text className="text-white font-SatoshiMedium ml-2 capitalize">
                          {profile.occupation}
                        </Text>
                      </View>
                    )}

                    {profile.education && (
                      <View className="flex-row items-center">
                        <GraduationCap size={16} color="white" />
                        <Text className="text-white font-SatoshiMedium ml-2">
                          {profile.education}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>

          <View className="py-6 px-2">
            {/* Mutual Connections */}
            {profile.mutualFriends > 0 && (
              <View className="bg-white rounded-2xl p-4 mb-4">
                <Text className="text-app text-[20px] font-SatoshiMedium">
                  Shared interests
                </Text>

                {profile.mutualInterests.length > 0 && (
                  <View className="flex flex-row flex-wrap gap-2 mt-2">
                    {profile.mutualInterests.map((interest, index) => (
                      <View
                        key={index}
                        className="bg-white border-[0.4px] border-gray-300 px-4 py-2 rounded-full"
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
              <View className="bg-white rounded-2xl p-4 mb-4">
                <View className="flex-row items-center mb-2">
                  <Text className="text-[20px] font-SatoshiMedium text-app">
                    Looking for
                  </Text>
                </View>

                <View className="self-start bg-white items-center justify-center border border-gray-300 px-5 py-2 rounded-full">
                  <Text className="text-black text-[16px] font-Satoshi">
                    {profile.lookingFor}
                  </Text>
                </View>
              </View>
            )}

            {/* Bio */}
            {profile.bio && (
              <View className="bg-white  mb-5 p-6 rounded-2xl">
                <View className="flex-row items-center mb-3">
                  <Text className="text-[20px] font-SatoshiMedium text-app">
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
            <View className="bg-white p-6 mb-5 rounded-2xl">
              <View className="flex-row items-center mb-4">
                <Text className="text-[20px] font-SatoshiMedium text-app ml-2">
                  About me
                </Text>
              </View>

              {/* Two-column grid layout */}
              <View className="flex-row flex-wrap -mx-1.5">
                {profile.distance && (
                  <View className="w-1/2 px-1.5 mb-3">
                    <View className="bg-gray-100 rounded-lg p-3 flex-row items-center gap-3">
                      <MapPin color={"black"} size={20} />
                      <Text className="text-app text-lg">
                        {profile.distance}
                      </Text>
                    </View>
                  </View>
                )}

                {profile.occupation && (
                  <View className="w-1/2 px-1.5 mb-3">
                    <View className="bg-gray-100 rounded-lg p-3 flex-row items-center gap-3">
                      <Briefcase color={"black"} size={20} />
                      <Text className="text-app text-lg">
                        {profile.occupation}
                      </Text>
                    </View>
                  </View>
                )}

                {profile.height && (
                  <View className="w-1/2 px-1.5 mb-3">
                    <View className="bg-gray-100 rounded-lg p-3 flex-row items-center gap-3">
                      <Ruler color={"black"} size={20} />
                      <Text className="text-app text-lg">{profile.height}</Text>
                    </View>
                  </View>
                )}

                {profile.religion && (
                  <View className="w-1/2 px-1.5 mb-3">
                    <View className="bg-gray-100 rounded-lg p-3 flex-row items-center gap-3">
                      <MaterialCommunityIcons
                        name="hands-pray"
                        size={24}
                        color={"black"}
                      />
                      <Text className="text-app text-lg">
                        {profile.religion}
                      </Text>
                    </View>
                  </View>
                )}

                {profile.drinking && (
                  <View className="w-1/2 px-1.5 mb-3">
                    <View className="bg-gray-100 rounded-lg p-3 flex-row items-center gap-3">
                      <Wine color={"black"} size={20} />
                      <Text className="text-app text-lg">
                        {profile.drinking}
                      </Text>
                    </View>
                  </View>
                )}

                {profile.smoking && (
                  <View className="w-1/2 px-1.5 mb-3">
                    <View className="bg-gray-100 rounded-lg p-3 flex-row items-center gap-3">
                      <Cigarette color={"black"} size={20} />
                      <Text className="text-app text-lg">
                        {profile.smoking}
                      </Text>
                    </View>
                  </View>
                )}

                {profile.children && (
                  <View className="w-1/2 px-1.5 mb-3">
                    <View className="bg-gray-100 rounded-lg p-3 flex-row items-center gap-3">
                      <Baby color={"black"} size={20} />
                      <Text className="text-app text-lg">
                        {profile.children}
                      </Text>
                    </View>
                  </View>
                )}

                {profile.pets && (
                  <View className="w-1/2 px-1.5 mb-3">
                    <View className="bg-gray-100 rounded-lg p-3 flex-row items-center gap-3">
                      <Dog color={"black"} size={20} />
                      <Text className="text-app text-lg">{profile.pets}</Text>
                    </View>
                  </View>
                )}

                {profile.exercise && (
                  <View className="w-1/2 px-1.5 mb-3">
                    <View className="bg-gray-100 rounded-lg p-3 flex-row items-center gap-3">
                      <Dumbbell color={"black"} size={20} />
                      <Text className="text-app text-lg">
                        {profile.exercise}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>

            <View
              className="relative h-[500px] w-full mb-4"
              style={{ borderRadius: 20 }}
            >
              <Image
                source={{ uri: profile?.images?.[0] }}
                className="w-full h-full"
                contentFit="cover"
                style={{ width: "100%", height: 500, borderRadius: 20 }}
              />

              <View
                className="absolute inset-0 bg-black/20"
                style={{ borderRadius: 20 }}
              />
              <View className="absolute bottom-4 right-4">
                {" "}
                <CommentButton />
              </View>
            </View>

            {/* Education */}
            {profile.school && (
              <View className="bg-white  mb-5 p-6 rounded-2xl">
                <View className="flex-row items-center mb-3">
                  <Text className="text-[20px] font-SatoshiMedium text-app">
                    Education
                  </Text>
                </View>
                <Text className="text-app font-Satoshi text-base">
                  {profile.school}
                </Text>
              </View>
            )}

            {/* Questions */}
            <>
              {profile.questions?.length > 0 &&
                profile.questions.map((item, index) => (
                  <View key={index} className="bg-white  mb-4 p-5 rounded-2xl">
                    <Text className="text-app font-Satoshi text-base mb-2">
                      {item.question}
                    </Text>
                    <Text className="text-app font-SatoshiBold text-2xl leading-relaxed">
                      {item.answer}
                    </Text>
                  </View>
                ))}
            </>

            <View
              className="relative h-[500px] w-full mb-4"
              style={{ borderRadius: 20 }}
            >
              <Image
                source={{ uri: profile?.images?.[1] }}
                className="w-full h-full"
                contentFit="cover"
                style={{ width: "100%", height: 500, borderRadius: 20 }}
              />

              <View
                className="absolute inset-0 bg-black/20"
                style={{ borderRadius: 20 }}
              />
              <View className="absolute bottom-4 right-4">
                {" "}
                <CommentButton />
              </View>
            </View>

            {/* Interests */}
            {profile.interests?.length > 0 && (
              <View className="mb-6 bg-white  p-6 rounded-2xl">
                <View className="flex-row items-center mb-3">
                  <Text className="text-[20px] font-SatoshiMedium text-app">
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
                          : "bg-white border-[#D1D1D1]"
                      }`}
                    >
                      <Text
                        className={`font-SatoshiMedium ${
                          profile.mutualInterests?.includes(interest)
                            ? "text-primary"
                            : "text-gray-700"
                        }`}
                      >
                        {interest}
                        {profile.mutualInterests?.includes(interest) && " ✨"}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            <View className="gap-3">
              <View className="w-full py-5 bg-white justify-center items-center rounded-2xl">
                <Text className="text-xl font-SatoshiBold">
                  Share {profile.name}{" "}
                </Text>
              </View>
              <View className="w-full py-5 bg-white justify-center items-center rounded-2xl">
                <Text className="text-xl font-SatoshiBold">
                  Block {profile.name}{" "}
                </Text>
              </View>
              <View className="w-full py-5 bg-white  justify-center items-center rounded-2xl">
                <Text className="text-xl text-red-600 font-SatoshiBold">
                  Report {profile.name}{" "}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default ProfileCard;
