import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
    Briefcase,
    ChevronRight,
    Heart,
    MapPin,
    Star,
    User,
} from "lucide-react-native";
import { useState } from "react";
import {
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import LoadingImage from '../ui/LoadingImage';

const { width } = Dimensions.get("window");
const CARD_HEIGHT = 570;

const SwipeCard = ({ profile, actionMessage }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(1));
  const totalImages = profile?.images?.length || 1;
  const router = useRouter();

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

  return (
    <View style={styles.cardContainer}>
      {/* Action Message */}
      {actionMessage && (
        <View style={styles.actionMessage}>
          <Text style={styles.actionText}>{actionMessage}</Text>
        </View>
      )}

      {/* Main Image with Fade Animation */}
      <Animated.View style={[styles.imageContainer, { opacity: fadeAnim }]}>
        <LoadingImage
          source={{ uri: profile?.images?.[currentImageIndex] }}
          style={styles.image}
          containerStyle={StyleSheet.absoluteFillObject}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={200}
          indicatorColor="#fff"
          indicatorSize="large"
        />

        {/* Dark overlay */}
        <View style={styles.overlay} />
      </Animated.View>

      {/* Navigation Arrows */}
      {totalImages > 1 && (
        <>
          <TouchableOpacity
            style={[styles.navButton, styles.leftButton]}
            onPress={goPrev}
          >
            <ChevronRight
              size={28}
              color="white"
              style={{ transform: [{ rotate: "180deg" }] }}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navButton, styles.rightButton]}
            onPress={goNext}
          >
            <ChevronRight size={28} color="white" />
          </TouchableOpacity>
        </>
      )}

      <View style={styles.topInfo}>
        <View style={styles.topInfoLeft}>
          {/* Bond Score */}
          {profile.bondScore !== undefined && (
            <View style={styles.bondScore}>
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
        <BlurView intensity={25} tint="dark" style={styles.profileInfo}>
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

          {/* Interests */}
          {profile.interests && profile.interests.length > 0 && (
            <View style={styles.interestsContainer}>
              {profile.interests.slice(0, 4).map((interest, index) => (
                <View key={index} style={styles.interestPill}>
                  <Text style={styles.interestText}>{interest}</Text>
                </View>
              ))}
            </View>
          )}
        </BlurView>
      </LinearGradient>
    </View>
  );
};

export default SwipeCard;

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 32,
    overflow: "hidden",
    height: CARD_HEIGHT,
    backgroundColor: '#1E1E1E',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 5,
  },
  imageContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
    color: '#D1D5DB',
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "OutfitMedium",
  },
  pagination: {
    position: "absolute",
    bottom: 180,
    flexDirection: "row",
    alignSelf: "center",
    zIndex: 20,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.4)",
    marginHorizontal: 3,
  },
  activeDot: {
    backgroundColor: "#121212",
    width: 10,
  },
  navButton: {
    position: "absolute",
    top: "45%",
    zIndex: 30,
    backgroundColor: "rgba(0,0,0,0.3)",
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  leftButton: {
    left: 15,
  },
  rightButton: {
    right: 15,
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

  bondScore: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 0, 102, 0.85)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  bondText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
  location: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  locationText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
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
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    marginTop: -40,
  },
  profileHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  name: {
    color: "white",
    fontSize: 28,
    fontWeight: "700",
    fontFamily: "OutfitBold",
  },
  age: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 24,
    fontWeight: "500",
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
  occupationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  occupation: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 16,
    marginLeft: 8,
    fontFamily: "OutfitMedium",
  },
  interestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },
  interestPill: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  interestText: {
    color: "white",
    fontSize: 14,
    fontFamily: "OutfitMedium",
  },
});
