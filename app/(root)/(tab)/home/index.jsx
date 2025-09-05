import React, { useState, useRef, useEffect } from "react";
import { View, StyleSheet, Text, ScrollView, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
  interpolateColor,
  useAnimatedProps,
} from "react-native-reanimated";
import { Image } from "expo-image";
import HomeHeader from "../../../../components/headers/HomeHeader";
import ActionButtons from "../../../../components/homeScreen/ActionButtons";
import { profiles } from "../../../../data/profileData";
import ProfileCard from "../../../../components/homeScreen/ProfileCard";
import FilterModal from "../../../../components/modals/FilterModal";
import {
  ListFilter,
  RotateCcw,
  SlidersHorizontal,
  Star,
} from "lucide-react-native";

const Home = () => {
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const [flashMessage, setFlashMessage] = useState(null);
  const [showModal, setShowModal] = useState("");

  const animation = useSharedValue(1);
  const flashAnim = useSharedValue(0);
  const scrollY = useSharedValue(0);
  const scrollRef = useRef(null);

  const currentProfile = profiles[currentProfileIndex];

  useEffect(() => {
    // animate whenever profile changes
    animation.value = 0;
    animation.value = withTiming(1, { duration: 600 });
  }, [currentProfileIndex]);

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

    // move to next profile
    setCurrentProfileIndex((prev) => (prev + 1) % profiles.length);

    // reset scroll to top
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ y: 0, animated: false });
    }
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

  // Animated style for the profile header that appears on scroll
  const profileHeaderStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [0, 60], [0, 1], "clamp");
    const translateY = interpolate(scrollY.value, [0, 50], [-20, 0], "clamp");

    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  // Create animated components
  const AnimatedRotateCcw = Animated.createAnimatedComponent(RotateCcw);
  const AnimatedSlidersHorizontal =
    Animated.createAnimatedComponent(SlidersHorizontal);

  // Animated style for icon colors
  const iconColorStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      scrollY.value,
      [0, 60],
      ["#ffffff", "#000000"]
    );

    return { color };
  });

  // Animated style for the image tint color
  const imageTintStyle = useAnimatedStyle(() => {
    const tintColor = interpolateColor(
      scrollY.value,
      [0, 60],
      ["#ffffff", "#000000"]
    );

    return { tintColor };
  });


  
  return (
    <View style={{ flex: 1 }}>
      <View style={styles.headerWrapper}>
        <View className="flex-row justify-between gap-4">
          <Pressable onPress={() => setShowModal(true)}>
            <View className="justify-center items-center rounded-full">
              <Animated.Image
                source={require("../../../../assets/icons/bell.png")}
                style={[
                  {
                    width: 18,
                    height: 20,
                  },
                  imageTintStyle,
                ]}
                contentFit="cover"
              />
            </View>
          </Pressable>

          <Pressable onPress={() => setShowModal(true)}>
            <View className="justify-center items-center rounded-full">
              <Animated.Image
                source={require("../../../../assets/icons/Slider-white.png")}
                style={[
                  {
                    width: 18,
                    height: 18,
                  },
                  imageTintStyle,
                ]}
                contentFit="contain"
              />
            </View>
          </Pressable>
        </View>
      </View>

      {/* Profile Header that appears on scroll */}
      <Animated.View style={[styles.profileHeader, profileHeaderStyle]}>
        <View className="flex-row items-center">
          <Text className="text-black text-xl font-SatoshiBold mr-2">
            {currentProfile.name}
          </Text>

          <View className='flex-row items-center gap-1'>
            <Text className="text-black text-xl font-Satoshi">
              {currentProfile.age}
            </Text>
            {currentProfile.verified && (
              <View>
                <Image
                  source={require("../../../../assets/icons/verified-1.png")}
                  style={{ width: 18, height: 18 }}
                />
              </View>
            )}
          </View>
        </View>

        <View className="w-30" />
      </Animated.View>

      {/* Flash Message */}
      {flashMessage && (
        <Animated.View style={[styles.flashMessage, flashStyle]}>
          <Text style={styles.flashText}>{flashMessage}</Text>
        </Animated.View>
      )}

      {/* Profile Card */}
      <Animated.ScrollView
        ref={scrollRef}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[animatedStyle, { flex: 1 }]}>
          <ProfileCard profile={currentProfile} />
        </Animated.View>
      </Animated.ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtonWrapper}>
        <ActionButtons
          onSwipe={handleSwipe}
          onSuperLike={() => handleSwipe("right")}
        />
      </View>
      <FilterModal visible={showModal} onClose={() => setShowModal(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  headerWrapper: {
    position: "absolute",
    top: 60,
    left: 20, // 👈 add this
    right: 20, // 👈 keep this so it spans across
    zIndex: 50,
  },
  profileHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    paddingTop: 60,
    paddingBottom: 10,
    alignItems: "center",
    zIndex: 40,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  actionButtonWrapper: {
    position: "absolute",
    bottom: -9,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  flashMessage: {
    position: "absolute",
    top: 80,
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

export default Home;
