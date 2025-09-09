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
import {
  Heart,
  MapPin,
  User,
  Star,
  Briefcase,
  ChevronRight,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";

const AroundYouTab = ({ profile, actionMessage }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(1));
  const totalImages = profile?.images?.length || 1;
  const router = useRouter();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

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
    <View style={[styles.tabContent, { height: screenHeight - 200 }]}>
      {/* Action Message */}
      {actionMessage && (
        <View style={styles.actionMessage}>
          <Text style={styles.actionText}>{actionMessage}</Text>
        </View>
      )}

      {/* Main Image with Fade Animation */}
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
            contentFit="cover"
          />
          {/* Dark overlay */}
          <View style={styles.overlay} />

          {/* Gradient just for fade */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.8)"]}
            style={styles.bottomGradient}
          />

          {/* Floating Profile Info */}
          <View style={styles.profileInfo}>
            <View style={{ flex: 1 }}>
              {/* Name + Age + Verified + Chevron */}
              <View style={styles.nameRow}>
                <View style={styles.nameLeft}>
                  <Text style={styles.name}>
                    {profile.name}, {profile.age}
                  </Text>
                  {profile.verified && (
                    <View style={styles.verifiedBadge}>
                      <Star size={16} color="white" fill="white" />
                    </View>
                  )}
                </View>

                {/* Chevron on same line, pushed to right */}
                <TouchableOpacity
                  style={styles.profileButton}
                  onPress={handleNavigateToProfile}
                  className='bg-secondary'
                >
                  <Text className='text-primary text-sm leading-[15px] font-SatoshiBold text-center'>view profile</Text>
                </TouchableOpacity>
              </View>

              {/* Location under name */}
              {profile.location && (
                <View style={styles.locationContainer}>
                  <MapPin size={18} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.locationText}>
                    {profile.location}
                    {profile.distance ? `,  ${profile.distance}` : ""}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  tabContent: {
    flex: 1,
  },
  imageTouchContainer: {
    flex: 1,
    overflow: "hidden",
  },
  imageContainer: {
    flex: 1,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.15)",
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
    top: 70,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 5,
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
  bottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  profileInfo: {
    position: "absolute",
    bottom: 200, 
    left: 20,
    right: 20,
    zIndex: 10,
  },

  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

  },

  nameLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  name: {
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

  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  locationText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 16,
    marginLeft: 6,
    fontFamily: "SatoshiMedium",
  },

  profileButton: {
    width: 60,
    height: 60,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
});

export default AroundYouTab;
