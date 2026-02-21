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
} from "react-native-reanimated";
import { Image } from "expo-image";

import { profiles } from "../../../../data/profileData";
import ProfileCard from "../../../../components/homeScreen/ProfileCard";
import ActionButtons from "../../../../components/homeScreen/ActionButtons";
import { useProfile } from "../../../../context/ProfileContext";
import { Icons } from "../../../../constant/icons";
import LogoLoader from "../../../../components/ui/LogoLoader";
import { colors } from "../../../../constant/colors";


const ProfileScreen = () => {
  const { id, fromDiscover, categoryTitle, categoryPreference } =
    useLocalSearchParams();
  const router = useRouter();
  const [filteredProfiles, setFilteredProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const [flashMessage, setFlashMessage] = useState(null);
  const [showNoMoreProfiles, setShowNoMoreProfiles] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const { handleHomeSwipe, handleHomeSuperLike, homeProfiles } = useProfile();

  // Use react-native-reanimated's shared values
  const animation = useSharedValue(1);
  const flashAnim = useSharedValue(0);
  const scrollY = useSharedValue(0);
  const scrollRef = useRef(null);

  // Check if we're viewing a single profile or swiping through multiple
  const isSingleProfile = Boolean(id && fromDiscover);

  useEffect(() => {
    const filterProfiles = () => {
      setLoading(true);

      setTimeout(() => {
        let filtered;

        if (isSingleProfile) {
          // If we're viewing a single profile, find just that one
          filtered = homeProfiles.filter(
            (profile) => String(profile.id) === String(id)
          );
        } else {
          // Otherwise, filter by preference as before
          filtered = homeProfiles.filter(
            (profile) =>
              String(profile.lookingFor || "").toLowerCase() ===
              String(categoryPreference || "").toLowerCase()
          );
        }

        setFilteredProfiles(filtered);
        setLoading(false);

        // If we're viewing a single profile, set the index to 0
        if (isSingleProfile) {
          setCurrentProfileIndex(0);
        }
      }, 500);
    };

    filterProfiles();
  }, [id, isSingleProfile, categoryPreference, homeProfiles]);

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
      const currentProfile = filteredProfiles[currentProfileIndex];
      handleHomeSwipe(direction, currentProfile);

      if (currentProfileIndex < filteredProfiles.length - 1) {
        setCurrentProfileIndex(currentProfileIndex + 1);
      } else {
        // Navigate back to discover screen after the last profile
        if (fromDiscover) {
          router.push({
            pathname: "/discover-profile",
            params: {
              preference: categoryPreference,
              title: categoryTitle,
            },
          });
        } else {
          router.back();
        }
      }
    }, 800);
  };

  const handleSuperLike = () => {
    if (filteredProfiles.length === 0) return;

    showFlashMessage("right");

    // Use a small delay to show the flash message before moving to next profile
    setTimeout(() => {
      const currentProfile = filteredProfiles[currentProfileIndex];
      handleHomeSuperLike(currentProfile);

      if (currentProfileIndex < filteredProfiles.length - 1) {
        setCurrentProfileIndex(currentProfileIndex + 1);
      } else {
        // Navigate back to discover screen after the last profile
        if (fromDiscover) {
          router.push({
            pathname: "/discover-profiles",
            params: {
              preference: categoryPreference,
              title: categoryTitle,
            },
          });
        } else {
          router.back();
        }
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

  const handleBack = () => {
    if (fromDiscover) {
      // If we came from discover, go back to the discover profiles screen
      router.push({
        pathname: "/discover-profiles",
        params: {
          preference: categoryPreference,
          title: categoryTitle,
        },
      });
    } else {
      // Otherwise, just go back
      router.back();
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
        <LogoLoader color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (filteredProfiles.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack}>
            <ChevronLeft size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.profilesTitle}>
            {categoryTitle || "Profiles"}
          </Text>
          <TouchableOpacity>
            <Filter size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsText}>
            No profiles found for this category
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
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Static Header (visible by default, fades out when scrolling) */}
      <Animated.View style={[styles.staticHeader, staticHeaderStyle]}>
        <View style={styles.staticHeaderRow}>
          <Pressable onPress={handleBack} style={styles.staticBackButton}>
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
          <Pressable onPress={handleBack} style={styles.leftIcon}>
            <ChevronLeft size={24} color="#333" />
          </Pressable>

          {/* Center: Name & Age */}
          <View style={styles.centerContent}>
            <View style={styles.nameContainer}>
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

      {showNoMoreProfiles ? (
        <View style={styles.noMoreContainer}>
          <Text style={styles.noMoreTitle}>You've reached the end!</Text>
          <Text style={styles.noMoreText}>
            You've seen all profiles in this category.
          </Text>

          <View style={styles.noMoreButtons}>
            <TouchableOpacity
              style={[styles.noMoreButton, styles.loadMoreButton]}
              onPress={loadMoreProfiles}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.noMoreButtonText}>Load More</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.noMoreButton, styles.backButton]}
              onPress={handleBack}
            >
              <Text style={styles.noMoreButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.actionButtonWrapper}>
          <ActionButtons onSwipe={handleSwipe} onSuperLike={handleSuperLike} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
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
  profilesTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  noResultsSubtext: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
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
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
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

export default ProfileScreen;
