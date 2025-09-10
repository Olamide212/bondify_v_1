import React, { useRef, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
  interpolateColor,
} from "react-native-reanimated";
import { Image } from "expo-image";
import ProfileCard from "../../../components/homeScreen/ProfileCard";
import ActionButtons from "../../../components/homeScreen/ActionButtons";
import { useProfile } from "../../../context/ProfileContext";
import { Icons } from "../../../constant/icons";
import BackArrow from "../../../components/ui/BackArrow";
import { ChevronLeft } from "lucide-react-native";

const UserProfile = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const {
    handleSwipe: contextHandleSwipe,
    handleSuperLike: contextHandleSuperLike,
    profiles, // Get profiles from context
  } = useProfile();

  const [flashMessage, setFlashMessage] = React.useState(null);

  const animation = useSharedValue(1);
  const flashAnim = useSharedValue(0);
  const scrollY = useSharedValue(0);
  const scrollRef = useRef(null);

  const profile = profiles.find((item) => item.id === Number(id));

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
    showFlashMessage(direction);

    // Use a small delay to show the flash message before navigating
    setTimeout(() => {
      contextHandleSwipe(direction);
      router.back();
    }, 800);
  };

  const handleSuperLike = () => {
    showFlashMessage("right");

    // Use a small delay to show the flash message before navigating
    setTimeout(() => {
      contextHandleSuperLike();
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

  if (!profile) {
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
            <View className="flex-row items-center">
              <Text className="text-black text-xl font-SatoshiBold mr-2">
                {profile.name}
              </Text>
              <Text className="text-black text-xl font-Satoshi">
                {profile.age}
              </Text>
              {profile.verified && (
                <Image
                  source={Icons.verified}
                  style={{ width: 18, height: 18 }}
                />
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
        <Animated.View style={[ { flex: 1 }]}>
          <ProfileCard profile={profile} />
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
    bottom: 30,
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
