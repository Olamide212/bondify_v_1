import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    Pressable,
    StyleSheet,
    Text,
    View
} from "react-native";
import Animated, {
    interpolate,
    runOnJS,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import ActionButtons from "../../../components/homeScreen/ActionButtons";
import ProfileCard from "../../../components/homeScreen/ProfileCard";
import BackArrow from "../../../components/ui/BackArrow";
import VerifiedIcon from "../../../components/ui/VerifiedIcon";
import { useProfile } from "../../../context/ProfileContext";
import { profileService } from "../../../services/profileService";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const UserProfile = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { handleHomeSwipe, handleHomeSuperLike, homeProfiles } = useProfile();

  const [flashMessage, setFlashMessage] = useState(null);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const animation = useSharedValue(1);
  const flashAnim = useSharedValue(0);
  const scrollY = useSharedValue(0);
  const scrollRef = useRef(null);

  const normalizeImages = (images) => {
    if (!Array.isArray(images)) return [];
    return images
      .map((image) => {
        if (typeof image === "string") return image;
        if (!image || typeof image !== "object") return null;
        return (
          image.url ||
          image.uri ||
          image.secure_url ||
          image.imageUrl ||
          image.image ||
          image.src ||
          null
        );
      })
      .filter(Boolean);
  };

  const formatLocation = (location) => {
    if (!location || typeof location !== "object") return location || "";
    const parts = [location.city, location.state, location.country].filter(Boolean);
    return parts.join(", ");
  };

  const normalizeProfile = (profile) => {
    const normalizedImages = normalizeImages(profile?.images);
    return {
      id: profile?._id ?? profile?.id,
      name:
        profile?.name ||
        [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
        profile?.username ||
        "Unknown",
      age: profile?.age ?? null,
      gender: profile?.gender,
      zodiac: profile?.zodiacSign ?? profile?.zodiac,
      location: formatLocation(profile?.location) || profile?.location,
      distance: profile?.distance,
      bondScore: profile?.bondScore,
      verified: profile?.verified ?? profile?.isVerified ?? false,
      occupation: profile?.occupation,
      completion: profile?.completionPercentage ?? profile?.completion,
      religion: profile?.religion,
      education: profile?.education,
      school: profile?.school,
      height: profile?.height,
      loveStyle: profile?.loveLanguage ?? profile?.loveStyle,
      communicationStyle: profile?.communicationStyle,
      financialStyle: profile?.financialStyle,
      lookingFor: profile?.lookingFor,
      relationshipType: profile?.relationshipType,
      drinking: profile?.drinking,
      smoking: profile?.smoking,
      exercise: profile?.exercise,
      pets: profile?.pets,
      children: profile?.children,
      lastActive: profile?.lastActive,
      joined: profile?.joined,
      language: profile?.languages ?? profile?.language ?? [],
      nationality: profile?.nationality,
      ethnicity: profile?.ethnicity,
      mutualFriends: profile?.mutualFriends ?? 0,
      mutualInterests: profile?.mutualInterests ?? [],
      interests: profile?.interests ?? [],
      personalities: profile?.personalities ?? [],
      bio: profile?.bio ?? "",
      questions: profile?.questions ?? [],
      images: normalizedImages.length > 0 ? normalizedImages : [],
    };
  };

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        setLoadingProfile(true);

        const profileFromContext = homeProfiles?.find(
          (item) => String(item.id) === String(id)
        );

        if (profileFromContext) {
          if (isMounted) setCurrentProfile(profileFromContext);
          return;
        }

        const profileFromApi = await profileService.getProfileById(id);
        if (isMounted) {
          setCurrentProfile(normalizeProfile(profileFromApi));
        }
      } catch (_error) {
        if (isMounted) {
          setCurrentProfile(null);
        }
      } finally {
        if (isMounted) {
          setLoadingProfile(false);
        }
      }
    };

    if (id) {
      loadProfile();
    } else {
      setLoadingProfile(false);
    }

    return () => {
      isMounted = false;
    };
  }, [id, homeProfiles]);

  useEffect(() => {
    animation.value = 0;
    animation.value = withTiming(1, { duration: 600 });
  }, [id]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const showFlashMessage = (direction) => {
    const message = direction === "right" ? "Liked ❤️" : "Passed 👎";
    setFlashMessage(message);

    flashAnim.value = 0;
    flashAnim.value = withTiming(1, { duration: 300 }, () => {
      flashAnim.value = withTiming(0, { duration: 300, delay: 400 }, () => {
        runOnJS(setFlashMessage)(null);
      });
    });
  };

  const handleSwipe = (direction) => {
    if (!currentProfile) return;

    showFlashMessage(direction);

    // Use a small delay to show the flash message before navigating
    setTimeout(() => {
      handleHomeSwipe(direction, currentProfile);
      router.back();
    }, 800);
  };

  const handleSuperLike = () => {
    if (!currentProfile) return;

    showFlashMessage("right");

    // Use a small delay to show the flash message before navigating
    setTimeout(() => {
      handleHomeSuperLike(currentProfile);
      router.back();
    }, 800);
  };

  const animatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(animation.value, [0, 1], [60, 0]);
    const scale = interpolate(animation.value, [0, 1], [0.9, 1]);

    return {
      transform: [{ translateY }, { scale }],
      opacity: animation.value,
    };
  });

  const flashStyle = useAnimatedStyle(() => {
    return {
      opacity: flashAnim.value,
      transform: [
        { translateY: interpolate(flashAnim.value, [0, 1], [-20, 0]) },
      ],
    };
  });

  const profileHeaderStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [0, 60], [0, 1], "clamp");
    const translateY = interpolate(scrollY.value, [0, 50], [-20, 0], "clamp");

    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  const staticHeaderStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [0, 60], [1, 0], "clamp");
    const translateY = interpolate(scrollY.value, [0, 50], [0, -20], "clamp");

    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  if (loadingProfile) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#5A56D0" />
      </View>
    );
  }

  if (!currentProfile) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <Text className="text-white">Profile not found.</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 ">
      {/* Static Header (visible by default, fades out when scrolling) */}
      <Animated.View style={[styles.staticHeader, staticHeaderStyle]}>
        <View style={styles.staticHeaderRow}>
          <Pressable
            onPress={() => router.back()}
            style={styles.staticBackButton}
          >
            <View style={styles.backButtonCircle}>
              <ChevronLeft size={24} color="#FFF" />
            </View>
          </Pressable>
        </View>
      </Animated.View>

      {/* Animated Header that appears on scroll */}
      <Animated.View style={[styles.profileHeader, profileHeaderStyle]}>
        <View style={styles.headerRow}>
          {/* Left: Back Arrow */}
          <Pressable onPress={() => router.back()} style={styles.leftIcon}>
            <BackArrow color="#000" />
          </Pressable>

          {/* Center: Name & Age */}
          <View style={styles.centerContent}>
            <View className="flex-row items-center gap-1">
              <View className='flex-row items-center'>
                <Text className="text-black text-2xl font-SatoshiBold mr-2">
                  {currentProfile.name}
                </Text>
                <Text className="text-black text-2xl font-Satoshi">
                  {currentProfile.age}
                </Text>
              </View>

              {currentProfile.verified && (
                <VerifiedIcon style={{ width: 18 }} />
              )}
            </View>
          </View>

          {/* Right: Empty spacer to balance center alignment */}
          <View style={styles.rightSpacer} />
        </View>
      </Animated.View>

      {/* Flash Message */}
      {flashMessage && (
        <Animated.View style={[styles.flashMessage, flashStyle]}>
          <Text style={styles.flashText}>{flashMessage}</Text>
        </Animated.View>
      )}

      <Animated.ScrollView
        ref={scrollRef}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[{ flex: 1 }]}>
          <ProfileCard profile={currentProfile} />
        </Animated.View>
      </Animated.ScrollView>

      <View style={styles.actionButtonWrapper}>
        <ActionButtons onSwipe={handleSwipe} onSuperLike={handleSuperLike} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  staticHeader: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    paddingHorizontal: 15,
    zIndex: 50,
  },
  staticHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  staticBackButton: {
    width: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  backButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 15,
  },
  leftIcon: {
    width: 40, // reserve space for balancing
    justifyContent: "center",
    alignItems: "flex-start",
  },
  centerContent: {
    flex: 1,
    alignItems: "center", // centers text horizontally
  },
  rightSpacer: {
    width: 40, // balances the back arrow space
  },
  profileHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    paddingTop: 60,
    paddingBottom: 15,
    alignItems: "center",
    zIndex: 40,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  actionButtonWrapper: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  flashMessage: {
    position: "absolute",
    top: 100,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    zIndex: 100,
  },
  flashText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default UserProfile;
