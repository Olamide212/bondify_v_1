import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
  useWindowDimensions,
} from "react-native";
import { Heart, MapPin, User, Star, Briefcase } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import CommentButton from "../../components/ui/CommentButton"

const AroundYouTab = ({ profile, actionMessage }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(1));
  const totalImages = profile?.images?.length || 1;
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();

  const handleImageChange = (newIndex) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setCurrentImageIndex(newIndex);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  };

  const goNext = () => {
    handleImageChange((currentImageIndex + 1) % totalImages);
  };

  const goPrev = () => {
    handleImageChange((currentImageIndex - 1 + totalImages) % totalImages);
  };

  const handleNavigateToProfile = () => {
    router.push(`/user-profile/${profile.id}`);
  };

  const handleTap = (event) => {
    const tapX = event.nativeEvent.locationX;
    const cardCenter = screenWidth / 2;
    tapX < cardCenter ? goPrev() : goNext();
  };

  return (
    <View style={styles.tabContent}>
      {/* Action Message */}
      {actionMessage && (
        <View style={styles.actionMessage}>
          <Text style={styles.actionText}>{actionMessage}</Text>
        </View>
      )}

      {/* Main Image with Fade Animation */}
      <TouchableOpacity
        style={styles.imageTouchContainer}
        activeOpacity={1}
        onPress={handleTap}
      >
        <Animated.View style={[styles.imageContainer, { opacity: fadeAnim }]}>
          <Image
            source={{ uri: profile?.images?.[currentImageIndex] }}
            style={styles.image}
          />
          {/* Dark overlay */}
          <View style={styles.overlay} />
          
        </Animated.View>

        <View style={styles.topInfo}>
          <View style={styles.topInfoLeft}>
            {/* Bond Score */}
            {profile.bondScore !== undefined && (
              <View className="bg-white/20 flex-row items-center p-2 rounded-full">
                <Heart size={16} color="white" fill="white" />
                <Text style={styles.bondText}>{profile.bondScore}%</Text>
              </View>
            )}

            {/* Image Pagination */}
            {totalImages > 1 && (
              <View style={styles.inlinePagination}>
                {[...Array(totalImages)].map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.paginationDot,
                      index === currentImageIndex && styles.activeDot,
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Bottom Profile Info */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.8)"]}
          style={styles.bottomGradient}
        >
          <BlurView className="bg-white/70 p-6 mx-4 left-0 right-0  rounded-2xl absolute overflow-hidden  ">
            <View style={styles.profileHeader}>
              <View style={styles.nameContainer}>
                <Text style={styles.name}>{profile.name}</Text>
                <Text style={styles.age}>, {profile.age}</Text>

                {profile.verified && (
                  <View style={styles.verifiedBadge}>
                    <Star size={16} color="white" fill="white" />
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.profileButton}
                onPress={handleNavigateToProfile}
              >
                <User size={24} color="white" />
              </TouchableOpacity>
            </View>

            {/* Occupation */}
            <View className="flex-row justify-between">
              {profile.occupation && (
                <View style={styles.occupationContainer}>
                  <Briefcase size={16} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.occupation}>{profile.occupation}</Text>
                </View>
              )}
              {profile.location && (
                <View style={styles.occupationContainer}>
                  <MapPin size={16} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.occupation}>{profile.distance}</Text>
                </View>
              )}
            </View>
          </BlurView>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  tabContent: {
    flex: 1,
  },
  imageTouchContainer: {
    height: 650,
    borderRadius: 30,
    overflow: "hidden",
  },
  imageContainer: {
    flex: 1,
    borderRadius: 24,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 30,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.15)",
    borderRadius: 24,
  },

  actionMessage: {
    position: "absolute",
    top: 100,
    alignSelf: "center",
    zIndex: 50,
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  actionText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "SatoshiMedium",
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.4)",
    marginHorizontal: 3,
  },
  activeDot: {
    backgroundColor: "white",
    width: 10,
  },
  topInfo: {
    position: "absolute",
    top: 20,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    zIndex: 20,
  },
  topInfoLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  inlinePagination: {
    flexDirection: "row",
    marginLeft: 10,
  },

  bondText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
  bottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    paddingTop: 30,
  },
  profileInfo: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    overflow: "hidden",
    marginRight: 15,
    marginLeft: 15,
  },
  profileHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  name: {
    color: "white",
    fontSize: 28,
    fontFamily: "SatoshiBold",
  },
  age: {
    color: "white",
    fontSize: 28,
    fontFamily: "SatoshiBold",
  },
  verifiedBadge: {
    marginLeft: 8,
    backgroundColor: "#3B82F6",
    padding: 4,
    borderRadius: 12,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  detailsContainer: {
    flexDirection: "col",
    gap: 5,
    justifyContent: "space-between",
    marginBottom: 12,
  },
  occupationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  occupation: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 16,
    marginLeft: 8,
    fontFamily: "SatoshiMedium",
    maxWidth: 150,
  },
});

export default AroundYouTab;
