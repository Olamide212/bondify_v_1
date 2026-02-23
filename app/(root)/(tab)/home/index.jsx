// Home.js (updated)
import { Image } from "expo-image";
import { Bot } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import ActionButtons from "../../../../components/homeScreen/ActionButtons";
import AroundYou from "../../../../components/homeScreen/AroundYouTab";
import AIAssistantModal from "../../../../components/modals/AIAssistantModal"; // New import
import FilterModal from "../../../../components/modals/FilterModal";
import MatchCelebrationModal from "../../../../components/modals/MatchCelebrationModal";
import UserProfileModal from "../../../../components/modals/UserProfileModal";
import LogoLoader from "../../../../components/ui/LogoLoader";
import { colors } from "../../../../constant/colors";
import { useProfile } from "../../../../context/ProfileContext";

const Home = () => {
  const {
    homeCurrentProfileIndex,
    homeProfiles,
    handleHomeSwipe,
    handleHomeSuperLike,
    profilesLoading,
    homeFilters,
    setHomeFilters,
    matchCelebration,
    setMatchCelebration,
  } = useProfile();

  const [flashMessage, setFlashMessage] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false); // AI Modal state
  const [selectedProfileId, setSelectedProfileId] = useState(null);
  const animation = useSharedValue(1);
  const flashAnim = useSharedValue(0);

  const currentProfile =
    homeProfiles.length > 0
      ? homeProfiles[homeCurrentProfileIndex % homeProfiles.length]
      : null;

  useEffect(() => {
    animation.value = 0;
    animation.value = withTiming(1, { duration: 600 });
  }, [homeCurrentProfileIndex, animation]);

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

  if (profilesLoading) {
    return <LogoLoader color={colors.primary} />;
  }

  // Show explicit empty state for real DB data (instead of mock fallback)
  if (!homeProfiles || homeProfiles.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No users around you yet</Text>
        <Text style={styles.emptySubtitle}>
          Check back shortly to discover newly registered users.
        </Text>
      </View>
    );
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
        initialFilters={homeFilters}
        onApply={setHomeFilters}
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

      {/* Match Celebration Modal */}
      <MatchCelebrationModal
        visible={!!matchCelebration}
        onClose={() => setMatchCelebration(null)}
        matchedUser={matchCelebration}
        currentUser={null}
        onSendMessage={(user) => {
          setMatchCelebration(null);
        }}
        onContinueSwiping={() => {
          setMatchCelebration(null);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 24,
    color: "#111",
    fontFamily: "SatoshiBold",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#666",
    fontFamily: "Satoshi",
    textAlign: "center",
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
