import React, { useCallback, useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import GeneralHeader from "../../../../components/headers/GeneralHeader";
import TabNavigation from "../../../../components/explore/exploreScreenTab";
import VisitedYou from "../../../../components/explore/visitedYou";
import LikedYou from "../../../../components/explore/LikedYou";
import YouLiked from "../../../../components/explore/YouLiked";
import Passed from "../../../../components/explore/Passed";
import { profileService } from "../../../../services/profileService";
import { colors } from "../../../../constant/colors";

const normalizeProfile = (profile) => {
  const normalizeImages = (images) => {
    if (!Array.isArray(images)) return [];
    return images
      .map((image) => {
        if (typeof image === "string") return image;
        if (!image || typeof image !== "object") return null;
        return image.url || image.uri || image.secure_url || null;
      })
      .filter(Boolean);
  };

  const formatLocation = (location) => {
    if (!location || typeof location !== "object") return location || "";
    const parts = [location.city, location.state, location.country].filter(Boolean);
    return parts.join(", ");
  };

  return {
    id: profile?._id ?? profile?.id,
    name:
      profile?.name ||
      [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
      "Unknown",
    age: profile?.age ?? null,
    images: normalizeImages(profile?.images),
    location: formatLocation(profile?.location) || profile?.location || "",
    occupation: profile?.occupation,
    nationality: profile?.nationality,
    verified: profile?.verified ?? profile?.isVerified ?? false,
    likeType: profile?.likeType,
    likedAt: profile?.likedAt,
    passedAt: profile?.passedAt,
  };
};

export default function ExploreTabComponents() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("likedYou");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [likedYouData, setLikedYouData] = useState([]);
  const [youLikedData, setYouLikedData] = useState([]);
  const [passedData, setPassedData] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [likedYou, youLiked, passed] = await Promise.all([
        profileService.getLikedYou().catch((err) => { console.warn('Failed to fetch liked-you:', err?.message); return []; }),
        profileService.getYouLiked().catch((err) => { console.warn('Failed to fetch you-liked:', err?.message); return []; }),
        profileService.getPassed().catch((err) => { console.warn('Failed to fetch passed:', err?.message); return []; }),
      ]);
      setLikedYouData(likedYou.map(normalizeProfile));
      setYouLikedData(youLiked.map(normalizeProfile));
      setPassedData(passed.map(normalizeProfile));
    } catch (_error) {
      // Keep existing data on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUserPress = (user) => {
    const userId = user?.id || user?._id;
    // "youLiked" = view only (no actions), all other tabs show action buttons
    const showActions = activeTab !== "youLiked";
    router.push({
      pathname: `/user-profile/${userId}`,
      params: { showActions: showActions ? "true" : "false" },
    });
  };

  const renderActiveTab = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    switch (activeTab) {
      case "visitedYou":
        return (
          <VisitedYou data={[]} onUserPress={handleUserPress} />
        );
      case "likedYou":
        return (
          <LikedYou
            data={likedYouData}
            onUserPress={handleUserPress}
            selectedUsers={selectedUsers}
          />
        );
      case "youLiked":
        return <YouLiked data={youLikedData} onUserPress={handleUserPress} />;
      case "passed":
        return <Passed data={passedData} onUserPress={handleUserPress} />;
      default:
        return (
          <LikedYou
            data={likedYouData}
            onUserPress={handleUserPress}
            selectedUsers={selectedUsers}
          />
        );
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <GeneralHeader title="Discover" />
        <View>
          <TabNavigation
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            visitedCount={0}
            likedCount={likedYouData.length}
            youLikedCount={youLikedData.length}
            passedCount={passedData.length}
          />
        </View>

        <View style={{ flex: 1 }}>{renderActiveTab()}</View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
});