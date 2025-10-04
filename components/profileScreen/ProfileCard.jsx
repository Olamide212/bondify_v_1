import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ImageBackground,
} from "react-native";
import { BlurView } from "expo-blur";

const { width } = Dimensions.get("window");

const ProfileCard = ({ profile, height = 200, onPress }) => {
  return (
    <TouchableOpacity
      style={[styles.container, { height }]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <ImageBackground
        source={{ uri: profile.images[0] }}
        style={styles.image}
        resizeMode="cover"
      >
        {/* Bottom overlay with blur effect */}
        <View style={styles.overlay}>
          <BlurView intensity={80} style={styles.blurContainer} tint="dark">
            <View style={styles.infoContainer}>
              <Text style={styles.name} numberOfLines={1}>
                {profile.name}, {profile.age}
              </Text>

              {profile.occupation && (
                <Text style={styles.detail} numberOfLines={1}>
                  {profile.occupation}
                </Text>
              )}

              <Text style={styles.detail} numberOfLines={1}>
                {profile.location}
              </Text>

              {profile.nationality && (
                <Text style={styles.detail} numberOfLines={1}>
                  {profile.nationality}
                </Text>
              )}
            </View>
          </BlurView>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: (width - 40) / 2,
    borderRadius: 16,
    overflow: "hidden",
    margin: 8,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "white",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  image: {
    flex: 1,
    width: "100%",
    height: "100%",
    justifyContent: "flex-end",
  },
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  blurContainer: {
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
  },
  detail: {
    color: "white",
    fontSize: 12,
    opacity: 0.9,
    marginBottom: 2,
  },
});

export default ProfileCard;
