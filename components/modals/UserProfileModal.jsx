import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Dimensions,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
} from "react-native-reanimated";
import { Image } from "expo-image";
import ProfileCard from "../homeScreen/ProfileCard";
import ActionButtons from "../homeScreen/ActionButtons";
import { useProfile } from "../../context/ProfileContext";
import { Icons } from "../../constant/icons";
import BaseModal from "./BaseModal";
import { ChevronLeft, X } from "lucide-react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const UserProfileModal = ({ visible, onClose, profileId }) => {
  const {
    handleSwipe: contextHandleSwipe,
    handleSuperLike: contextHandleSuperLike,
    profiles,
  } = useProfile();

  const [flashMessage, setFlashMessage] = useState(null);
  const [currentProfile, setCurrentProfile] = useState(null);

  const animation = useSharedValue(0);
  const flashAnim = useSharedValue(0);
  const scrollY = useSharedValue(0);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (visible) {
      animation.value = withTiming(1, { duration: 300 });
    } else {
      animation.value = 0;
    }
  }, [visible]);

  // In UserProfileModal.js, add this useEffect
  useEffect(() => {
    if (profileId && profiles) {
      const profile = profiles.find(
        (item) => String(item.id) === String(profileId)
      );
      setCurrentProfile(profile);
    }
  }, [profileId, profiles]);

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

    // Use a small delay to show the flash message before closing
    setTimeout(() => {
      contextHandleSwipe(direction, currentProfile);
      onClose();
    }, 800);
  };

  const handleSuperLike = () => {
    if (!currentProfile) return;

    showFlashMessage("right");

    // Use a small delay to show the flash message before closing
    setTimeout(() => {
      contextHandleSuperLike(currentProfile);
      onClose();
    }, 800);
  };

  const animatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(animation.value, [0, 1], [SCREEN_HEIGHT, 0]);
    return {
      transform: [{ translateY }],
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

  if (!currentProfile) {
    return null;
  }

  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      animationType="slide"
      style={styles.modalContainer}
    >
      <Animated.View style={[styles.modalContent, animatedStyle]}>
        {/* Static Header (visible by default, fades out when scrolling) */}
        <Animated.View style={[styles.staticHeader, staticHeaderStyle]}>
          <View style={styles.staticHeaderRow}>
            <Pressable onPress={onClose} style={styles.staticBackButton}>
              <View style={styles.backButtonCircle}>
                <X size={24} color="#FFF" />
              </View>
            </Pressable>
          </View>
        </Animated.View>

        {/* Animated Header that appears on scroll */}
        <Animated.View style={[styles.profileHeader, profileHeaderStyle]}>
          <View style={styles.headerRow}>
            {/* Left: Close Button */}
            <Pressable onPress={onClose} style={styles.leftIcon}>
              <X size={24} color="#000" />
            </Pressable>

            {/* Center: Name & Age */}
            <View style={styles.centerContent}>
              <View className="flex-row items-center">
                <Text className="text-black text-xl font-SatoshiBold mr-2">
                  {currentProfile.name}
                </Text>
                <Text className="text-black text-xl font-Satoshi">
                  {currentProfile.age}
                </Text>
                {currentProfile.verified && (
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
          <View style={{ flex: 1 }}>
            <ProfileCard profile={currentProfile} />
          </View>
        </Animated.ScrollView>

        <View style={styles.actionButtonWrapper}>
          <ActionButtons onSwipe={handleSwipe} onSuperLike={handleSuperLike} />
        </View>
      </Animated.View>
    </BaseModal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    margin: 0,
    justifyContent: "flex-end",
  },
  modalContent: {
    height: SCREEN_HEIGHT,
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
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
    width: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
  },
  rightSpacer: {
    width: 40,
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

export default UserProfileModal;
