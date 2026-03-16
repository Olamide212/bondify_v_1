import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import TabNavigation from "../../../../components/explore/exploreScreenTab";
import LikedYou from "../../../../components/explore/LikedYou";
import Passed from "../../../../components/explore/Passed";
import VisitedYou from "../../../../components/explore/visitedYou";
import YouLiked from "../../../../components/explore/YouLiked";
import GeneralHeader from "../../../../components/headers/GeneralHeader";
import { colors } from "../../../../constant/colors";
import { profileService } from "../../../../services/profileService";

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
  const [loading, setLoading] = useState(true);

  const [likedYouData, setLikedYouData] = useState([]);
  const [youLikedData, setYouLikedData] = useState([]);
  const [passedData, setPassedData] = useState([]);
  const [visitedYouData, setVisitedYouData] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [likedYou, youLiked, passed, visitors] = await Promise.all([
        profileService.getLikedYou().catch((err) => { console.warn('Failed to fetch liked-you:', err?.message); return []; }),
        profileService.getYouLiked().catch((err) => { console.warn('Failed to fetch you-liked:', err?.message); return []; }),
        profileService.getPassed().catch((err) => { console.warn('Failed to fetch passed:', err?.message); return []; }),
        profileService.getProfileVisitors().catch((err) => { console.warn('Failed to fetch visitors:', err?.message); return []; }),
      ]);
      setLikedYouData(likedYou.map(normalizeProfile));
      setYouLikedData(youLiked.map(normalizeProfile));
      setPassedData(passed.map(normalizeProfile));
      setVisitedYouData(visitors.map(normalizeProfile));
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
    // Only show actions for likedYou and passed tabs
    const showActions = activeTab === "likedYou" || activeTab === "passed";
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
          <VisitedYou data={visitedYouData} onUserPress={handleUserPress} />
        );
      case "likedYou":
        return (
          <LikedYou
            data={likedYouData}
            onUserPress={handleUserPress}
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
          />
        );
    }
  };

  return (
    <SafeAreaProvider>
     
      <SafeAreaView style={{ flex: 1 }} className="bg-white">
             <GeneralHeader title="Discover" />
    
        <View>
          <TabNavigation
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            visitedCount={visitedYouData.length}
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