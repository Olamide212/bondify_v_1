import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Filter, ChevronLeft } from "lucide-react-native";
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

import { styles } from "../../../../styles/discoverStyles";
import { profiles } from "../../../../data/profileData";
import ProfileCard from "../../../../components/homeScreen/ProfileCard";
import ActionButtons from "../../../../components/homeScreen/ActionButtons";
import { useProfile } from "../../../../context/ProfileContext";
import BackArrow from "../../../../components/ui/BackArrow";

const ProfilesByPreferenceScreen = () => {
  const { preference, title } = useLocalSearchParams();
  const router = useRouter();
  const [filteredProfiles, setFilteredProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const [flashMessage, setFlashMessage] = useState(null);
  const [showNoMoreProfiles, setShowNoMoreProfiles] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const {
    handleSwipe: contextHandleSwipe,
    handleSuperLike: contextHandleSuperLike,
  } = useProfile();

  const animation = useSharedValue(1);
  const flashAnim = useSharedValue(0);
  const scrollY = useSharedValue(0);
  const scrollRef = useRef(null);

  useEffect(() => {
    const filterProfiles = () => {
      setLoading(true);

      setTimeout(() => {
        const filtered = profiles.filter(
          (profile) =>
            profile.lookingFor.toLowerCase() === preference.toLowerCase()
        );
        setFilteredProfiles(filtered);
        setLoading(false);
      }, 500);
    };

    filterProfiles();
  }, [preference]);

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
    if (filteredProfiles.length === 0) return;

    showFlashMessage(direction);

    // Use a small delay to show the flash message before moving to next profile
    setTimeout(() => {
      contextHandleSwipe(direction, filteredProfiles[currentProfileIndex]);

      if (currentProfileIndex < filteredProfiles.length - 1) {
        setCurrentProfileIndex(currentProfileIndex + 1);
      } else {
        // Show no more profiles message instead of navigating back
        setShowNoMoreProfiles(true);
      }
    }, 800);
  };

  const handleSuperLike = () => {
    if (filteredProfiles.length === 0) return;

    showFlashMessage("right");

    // Use a small delay to show the flash message before moving to next profile
    setTimeout(() => {
      contextHandleSuperLike(filteredProfiles[currentProfileIndex]);

      if (currentProfileIndex < filteredProfiles.length - 1) {
        setCurrentProfileIndex(currentProfileIndex + 1);
      } else {
        // Show no more profiles message instead of navigating back
        setShowNoMoreProfiles(true);
      }
    }, 800);
  };

  const loadMoreProfiles = () => {
    setLoadingMore(true);

    // Simulate loading more profiles after a delay
    setTimeout(() => {
      // In a real app, you would fetch more profiles from an API
      // For this example, we'll just reset to the first profile
      setCurrentProfileIndex(0);
      setShowNoMoreProfiles(false);
      setLoadingMore(false);
    }, 1500);
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <Text>Finding profiles...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (filteredProfiles.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />

        {/* Header */}
        <View style={localStyles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ChevronLeft size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.profilesTitle}>{title || "Profiles"}</Text>
          <TouchableOpacity>
            <Filter size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsText}>
            No profiles found for this categoryj
          </Text>
          <Text style={styles.noResultsSubtext}>
            Check back later or try a different category
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentProfile = filteredProfiles[currentProfileIndex];

  return (
    <View style={localStyles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Static Header (visible by default, fades out when scrolling) */}
      <Animated.View style={[localStyles.staticHeader, staticHeaderStyle]}>
        <View style={localStyles.staticHeaderRow}>
          <Pressable
            onPress={() => router.back()}
            style={localStyles.staticBackButton}
          >
            <View style={localStyles.backButtonCircle}>
              <ChevronLeft size={24} color="#FFF" />
            </View>
          </Pressable>

          <View style={localStyles.staticHeaderRight}>
            <TouchableOpacity>
              <View style={localStyles.iconCircle}>
                <Filter size={20} color="#FFF" />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* Animated Header that appears on scroll */}
      <Animated.View style={[localStyles.profileHeader, profileHeaderStyle]}>
        <View style={localStyles.headerRow}>
          {/* Left: Back Arrow */}
          <Pressable onPress={() => router.back()} style={localStyles.leftIcon}>
            <BackArrow color="#000" />
          </Pressable>

          {/* Center: Name & Age */}
          <View style={localStyles.centerContent}>
            <View style={localStyles.nameContainer}>
              <Text style={localStyles.nameText}>{currentProfile.name}</Text>
              <Text style={localStyles.ageText}>{currentProfile.age}</Text>
              {currentProfile.verified && (
                <Image
                  source={require("../../../../assets/icons/verified.png")}
                  style={{ width: 18, height: 18 }}
                />
              )}
            </View>
          </View>

          {/* Right: Filter Icon */}
          <View style={localStyles.rightIcon}>
            <TouchableOpacity>
              <Filter size={24} color="#333" />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* Flash Message */}
      {flashMessage && (
        <Animated.View style={[localStyles.flashMessage, flashStyle]}>
          <Text style={localStyles.flashText}>{flashMessage}</Text>
        </Animated.View>
      )}

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

      {showNoMoreProfiles ? (
        <View style={localStyles.noMoreContainer}>
          <Text style={localStyles.noMoreTitle}>You've reached the end!</Text>
          <Text style={localStyles.noMoreText}>
            You've seen all profiles in this category.
          </Text>

          <View style={localStyles.noMoreButtons}>
            <TouchableOpacity
              style={[localStyles.noMoreButton, localStyles.loadMoreButton]}
              onPress={loadMoreProfiles}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={localStyles.noMoreButtonText}>Load More</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[localStyles.noMoreButton, localStyles.backButton]}
              onPress={() => router.back()}
            >
              <Text style={localStyles.noMoreButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={localStyles.actionButtonWrapper}>
          <ActionButtons onSwipe={handleSwipe} onSuperLike={handleSuperLike} />
        </View>
      )}
    </View>
  );
};

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  staticHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 60,
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
  staticHeaderRight: {
    width: 40,
    alignItems: "flex-end",
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
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
  rightIcon: {
    width: 40,
    alignItems: "flex-end",
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  nameText: {
    color: "black",
    fontSize: 20,
    fontWeight: "bold",
    marginRight: 8,
  },
  ageText: {
    color: "black",
    fontSize: 20,
    marginRight: 8,
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
  noMoreContainer: {
    position: "absolute",
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 10,
  },
  noMoreTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  noMoreText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
    color: "#666",
  },
  noMoreButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  noMoreButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
    marginHorizontal: 5,
  },
  loadMoreButton: {
    backgroundColor: "#FF5864",
  },
  backButton: {
    backgroundColor: "#888",
  },
  noMoreButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default ProfilesByPreferenceScreen;
