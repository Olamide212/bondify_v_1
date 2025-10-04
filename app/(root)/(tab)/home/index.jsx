// Home.js (updated)
import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  Pressable,
  useWindowDimensions,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  runOnJS,
} from "react-native-reanimated";
import { Image } from "expo-image";
import ActionButtons from "../../../../components/homeScreen/ActionButtons";
import FilterModal from "../../../../components/modals/FilterModal";
import { Icons } from "../../../../constant/icons";
import AroundYou from "../../../../components/homeScreen/AroundYouTab";
import { useProfile } from "../../../../context/ProfileContext";
import LogoLoader from "../../../../components/ui/LogoLoader";
import UserProfileModal from "../../../../components/modals/UserProfileModal";
import AIAssistantModal from "../../../../components/modals/AIAssistantModal"; // New import
import { colors } from "../../../../constant/colors";
import { Bot } from "lucide-react-native";

const Home = () => {
  const {
    homeCurrentProfileIndex,
    homeProfiles,
    handleHomeSwipe,
    handleHomeSuperLike,
    matches,
    likes,
  } = useProfile();

  const [flashMessage, setFlashMessage] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false); // AI Modal state
  const [selectedProfileId, setSelectedProfileId] = useState(null);
  const { height: windowHeight } = useWindowDimensions();

  const animation = useSharedValue(1);
  const flashAnim = useSharedValue(0);

  const currentProfile =
    homeProfiles.length > 0
      ? homeProfiles[homeCurrentProfileIndex % homeProfiles.length]
      : null;

  useEffect(() => {
    animation.value = 0;
    animation.value = withTiming(1, { duration: 600 });
  }, [homeCurrentProfileIndex]);

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
    handleHomeSwipe(direction, currentProfile);
  };

  const handleSuperLike = () => {
    if (!currentProfile) return;

    showFlashMessage("right");
    handleHomeSuperLike(currentProfile);
  };

  const handleViewProfile = () => {
    if (currentProfile) {
      setSelectedProfileId(currentProfile.id);
      setShowProfileModal(true);
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

  // Show loading state if no profile is available
  if (!homeProfiles || homeProfiles.length === 0) {
    return <LogoLoader color={colors.primary} />;
  }

  if (!currentProfile) {
    return <LogoLoader />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerWrapper}>
        <View className="flex-row justify-between gap-4">
          {/* AI Assistant Button */}
          <Pressable onPress={() => setShowAIModal(true)}>
            <View className="justify-center gap-2 rounded-full bg-secondary w-auto px-3 h-10 flex-row items-center ">
              <Bot size={22} color={colors.primary} />
              <Text className="font-GeneralSansMedium text-primary">AI Chat</Text>
            </View>
          </Pressable>

          <View className='flex-row gap-2'>
            <Pressable onPress={() => setShowFilterModal(true)}>
              <View className="justify-center items-center rounded-full bg-black/10 w-12 h-12 ">
                <Image
                  source={require("../../../../assets/icons/bell.png")}
                  style={{
                    width: 18,
                    height: 20,
                    tintColor: "#ffffff",
                  }}
                  contentFit="cover"
                />
              </View>
            </Pressable>

            <Pressable onPress={() => setShowFilterModal(true)}>
              <View className="justify-center items-center rounded-full bg-black/10  w-12 h-12">
                <Image
                  source={require("../../../../assets/icons/Slider-white.png")}
                  style={{
                    width: 18,
                    height: 18,
                    tintColor: "#ffffff",
                  }}
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

      {/* Main content without scrolling */}
      <View style={styles.aroundYouContainer}>
        <Animated.View style={[animatedStyle, { flex: 1 }]}>
          <AroundYou
            profile={currentProfile}
            onViewProfile={handleViewProfile}
          />
        </Animated.View>
      </View>

      <View style={styles.actionButtonWrapper}>
        <ActionButtons onSwipe={handleSwipe} onSuperLike={handleSuperLike} Redo={true} />
      </View>

      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
      />

      <UserProfileModal
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        profileId={selectedProfileId}
      />

      {/* AI Assistant Modal */}
      <AIAssistantModal
        visible={showAIModal}
        onClose={() => setShowAIModal(false)}
        fullScreen
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  headerWrapper: {
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
    zIndex: 50,
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
