import React from "react";
import {
  View,
  Text,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

const UsersProfileCard = ({ profile, height = 200, onPress }) => {
  // Safe access to profile properties with fallbacks
  const profileImages = profile?.images || [];
  const profileName = profile?.name || "Unknown";
  const profileAge = profile?.age || "";
  const profileOccupation = profile?.occupation;
  const profileLocation = profile?.location || "Location unknown";
  const profileNationality = profile?.nationality;

  // Determine the image source
  const imageSource =
    profileImages.length > 0
      ? { uri: profileImages[0] }
      : { uri: "https://via.placeholder.com/150" };

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

const styles = StyleSheet.create({
  cardContainer: {
    width: (width - 48) / 2,
    marginHorizontal: 8,
  },
  touchable: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
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

export default UsersProfileCard;
