import React from "react";
import { View, Text, FlatList, StyleSheet, Dimensions, TouchableOpacity, ImageBackground } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

// UsersProfileCard component with safe data handling
const UsersProfileCard = ({ profile, height = 200, onPress }) => {
  // Safe access to profile properties with fallbacks
  const profileImages = profile?.images || [];
  const profileName = profile?.name ||
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
    "Unknown";
  const profileAge = profile?.age || "";
  const profileOccupation = profile?.occupation;
  const profileLocation = typeof profile?.location === "object"
    ? [profile?.location?.city, profile?.location?.state, profile?.location?.country].filter(Boolean).join(", ")
    : profile?.location || "Location unknown";
  const profileNationality = profile?.nationality;

  // Extract URL from image objects or strings
  const getImageUrl = (image) => {
    if (typeof image === "string") return image;
    if (image && typeof image === "object") {
      return image.url || image.uri || image.secure_url || null;
    }
    return null;
  };

  // Determine the image source
  const firstImageUrl = profileImages.length > 0
    ? getImageUrl(profileImages[0])
    : null;
  const imageSource = firstImageUrl
    ? { uri: firstImageUrl }
    : { uri: "https://via.placeholder.com/150" }; // Fallback to placeholder

  return (
    <View style={[styles.cardContainer, { height }]}>
      <TouchableOpacity
        style={styles.touchable}
        onPress={onPress}
        activeOpacity={0.9}
      >
        <ImageBackground
          source={imageSource}
          style={styles.image}
          resizeMode="cover"
        >
          <LinearGradient
            colors={[
              "transparent",
              "rgba(0,0,0,0.1)",
              "rgba(0,0,0,0.7)",
              "rgba(0,0,0,0.9)",
            ]}
            locations={[0, 0.4, 0.7, 1]}
            style={styles.gradient}
          >
            <View style={styles.infoContainer}>
              <Text style={styles.name} numberOfLines={1}>
                {profileName}
                {profileAge ? `, ${profileAge}` : ""}
              </Text>

              {profileOccupation && (
                <Text style={styles.detail} numberOfLines={1}>
                  {profileOccupation}
                </Text>
              )}

              <Text style={styles.detail} numberOfLines={1}>
                {profileLocation}
              </Text>

              {profileNationality && (
                <Text style={styles.detail} numberOfLines={1}>
                  {profileNationality}
                </Text>
              )}
            </View>
          </LinearGradient>
        </ImageBackground>
      </TouchableOpacity>
    </View>
  );
};

// VisitedYou component with proper layout
const VisitedYou = ({ data, onUserPress }) => {
  return (
    <View style={styles.tabContent}>
      <LinearGradient
        colors={["#4F46E5", "#7C3AED"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.banner}
      >
        <Text style={styles.bannerTitle}>
          👀 {data.length} people visited your profile!
        </Text>
        <Text style={styles.bannerSubtitle}>
          Check out who's interested in you.
        </Text>
      </LinearGradient>

      <FlatList
        data={data}
        keyExtractor={(item) => (item.id || item._id || "").toString()}
        renderItem={({ item }) => (
          <UsersProfileCard
            profile={item}
            onPress={() => onUserPress(item)}
            height={270}
          />
        )}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  tabContent: {
    flex: 1,
    padding: 16,
  },
  banner: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  bannerTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  bannerSubtitle: {
    color: "white",
    fontSize: 14,
  },
  listContent: {
    alignItems: "center",
    paddingBottom: 100,
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  cardContainer: {
    width: (width - 48) / 2, // Adjusted to account for padding and margins
    marginHorizontal: 8,
  },
  touchable: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  image: {
    flex: 1,
    width: "100%",
    height: "100%",
    justifyContent: "flex-end",
  },
  gradient: {
    padding: 12,
  },
  infoContainer: {
    padding: 4,
  },
  name: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 5,
  },
  detail: {
    color: "white",
    fontSize: 12,
    opacity: 0.9,
    marginBottom: 2,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 5,
  },
});

export default VisitedYou;
