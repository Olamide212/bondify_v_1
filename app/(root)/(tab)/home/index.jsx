import React, { useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  Pressable,
  useWindowDimensions,
} from "react-native";
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
import { useRouter } from "expo-router";
import ActionButtons from "../../../../components/homeScreen/ActionButtons";
import FilterModal from "../../../../components/modals/FilterModal";
import { Icons } from "../../../../constant/icons";
import AroundYou from "../../../../components/homeScreen/AroundYouTab";
import { useProfile } from "../../../../context/ProfileContext";

const Home = () => {
  const router = useRouter();
  const {
    currentProfileIndex,
    handleSwipe: contextHandleSwipe,
    handleSuperLike: contextHandleSuperLike,
    profiles,
  } = useProfile();

  const [flashMessage, setFlashMessage] = React.useState(null);
  const [showModal, setShowModal] = React.useState(false);
  const { height: windowHeight } = useWindowDimensions();

  const animation = useSharedValue(1);
  const flashAnim = useSharedValue(0);
  const scrollY = useSharedValue(0);
  const scrollRef = useRef(null);

  // Add safety check for profiles array
  const currentProfile =
    profiles && profiles.length > 0
      ? profiles[currentProfileIndex % profiles.length]
      : null;

  useEffect(() => {
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
    contextHandleSwipe(direction);

    if (scrollRef.current) {
      scrollRef.current.scrollTo({ y: 0, animated: false });
    }
  };

  const handleSuperLike = () => {
    showFlashMessage("right");
    contextHandleSuperLike();

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

  const profileHeaderStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [0, 60], [0, 1], "clamp");
    const translateY = interpolate(scrollY.value, [0, 50], [-20, 0], "clamp");

    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  const imageTintStyle = useAnimatedStyle(() => {
    const tintColor = interpolateColor(
      scrollY.value,
      [0, 60],
      ["#ffffff", "#ffffff"]
    );

    return { tintColor };
  });

  const navigateToProfile = () => {
    if (currentProfile) {
      router.push(`/profile/${currentProfile.id}`);
    }
  };

  // Show loading state if no profile is available
  if (!profiles || profiles.length === 0) {
    return (
      <View style={styles.container}>
        <Text>Loading profiles...</Text>
      </View>
    );
  }

  if (!currentProfile) {
    return (
      <View style={styles.container}>
        <Text>No profiles available</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }} className="">
      <View style={styles.headerWrapper}>
        <View className="flex-row justify-end gap-4">
          <View className="flex-row items-center gap-2">
            <Pressable onPress={() => setShowModal(true)}>
              <View className="justify-center items-center rounded-full bg-white/5  w-12 h-12 ">
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
              <View className="justify-center items-center rounded-full bg-white/5  w-12 h-12">
                <Animated.Image
                  source={Icons.redo}
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

            <Pressable onPress={() => setShowModal(true)}>
              <View className="justify-center items-center rounded-full bg-white/5  w-12 h-12">
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
      </View>

    

      {flashMessage && (
        <Animated.View style={[styles.flashMessage, flashStyle]}>
          <Text style={styles.flashText}>{flashMessage}</Text>
        </Animated.View>
      )}

      <Pressable onPress={navigateToProfile} style={styles.aroundYouContainer}>
        <Animated.ScrollView
          ref={scrollRef}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[animatedStyle, { flex: 1 }]}>
            {/* Use AroundYou with proper styling */}
            <AroundYou profile={currentProfile} />
          </Animated.View>
        </Animated.ScrollView>
      </Pressable>

      <View style={styles.actionButtonWrapper}>
        <ActionButtons onSwipe={handleSwipe} onSuperLike={handleSuperLike} />
      </View>
      <FilterModal visible={showModal} onClose={() => setShowModal(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  headerWrapper: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    zIndex: 50,
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
    bottom: 85,
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
  aroundYouContainer: {
    flex: 1,
 
  },
});

export default Home;
