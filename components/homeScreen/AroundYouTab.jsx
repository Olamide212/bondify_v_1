import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Info,
  MapPin
} from "lucide-react-native";
import { useState } from "react";
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { colors } from "../../constant/colors";
import VerifiedIcon from "../ui/VerifiedIcon";

const FALLBACK_PROFILE_IMAGE = "https://via.placeholder.com/800x1200?text=No+Photo";

const AroundYouTab = ({ profile, actionMessage }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(1));
  const totalImages = profile?.images?.length || 1;
  const currentImageUri = profile?.images?.[currentImageIndex] || FALLBACK_PROFILE_IMAGE;
  const router = useRouter();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const formatDisplayName = (fullName) => {
    const parts = String(fullName || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (parts.length === 0) return "Unknown";
    if (parts.length === 1) return parts[0];

    const lastName = parts[0];
    return `${lastName} `;
  };

  const displayName = formatDisplayName(profile?.name);

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
    if (tapX < cardCenter) {
      goPrev();
    } else {
      goNext();
    }
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
        <Animated.View style={[styles.imageContainer]}>
          <Image
            source={{ uri: currentImageUri }}
            style={styles.image}
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
                  <View className='flex-row items-center gap-2'>
                    <Text className='text-white font-PlusJakartaSansBold text-4xl capitalize' numberOfLines={1}>{displayName},</Text>
                    <Text className='text-white text-3xl font-PlusJakartaSansMedium'>{profile.age}</Text>
                  </View>

                  <View className="flex-row gap-3">
                    {profile.verified && <VerifiedIcon />}
                  </View>
                </View>

                {/* Chevron on same line, pushed to right */}
                <TouchableOpacity
                  style={styles.profileButton}
                  onPress={handleNavigateToProfile}
                >
                  <Info size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Location under name */}
              {profile.location && (
                <View className="flex-row items-center gap-1 -mt-2">
                  <MapPin size={18} color={colors.secondary} />
                  <Text className="text-white font-PlusJakartaSansMedium text-lg">
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
    bottom: 120,
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
    gap: 5,
  },

  name: {
    color: "white",
    fontSize: 28,
    fontFamily: "PlusJakartaSansBold",
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
    marginTop: -10,
  },

  locationText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 16,
    marginLeft: 6,
    fontFamily: "PlusJakartaSansMedium",
  },

  profileButton: {
    width: 52,
    height: 52,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
    backgroundColor: "rgba(255,255,255,0.20)",
  },
});

export default AroundYouTab;
