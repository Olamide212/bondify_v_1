import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Info, MapPin } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
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

// ── FIX 1: location is a GeoJSON object {type, coordinates, city, state, country}
// Extract a human-readable string — never render the raw object directly
const formatLocation = (location) => {
  if (!location) return null;
  if (typeof location === "string" && location.trim().length > 0) return location.trim();
  if (typeof location === "object") {
    const parts = [location.city, location.state, location.country].filter(
      (v) => typeof v === "string" && v.trim().length > 0
    );
    return parts.length > 0 ? parts.join(", ") : null;
  }
  return null;
};

// ── FIX 2: images[] entries are objects {url, key, secure_url, ...} not plain strings
// Safely pull a URI string out of whatever shape the backend sends
const extractImageUri = (imageItem) => {
  if (!imageItem) return null;
  if (typeof imageItem === "string" && imageItem.length > 0) return imageItem;
  if (typeof imageItem === "object") {
    return (
      imageItem.url ||
      imageItem.uri ||
      imageItem.secure_url ||
      imageItem.imageUrl ||
      imageItem.src ||
      null
    );
  }
  return null;
};

// ── AroundYouTab is a pure display component.
// Home.js owns the profile index and passes the current profile as a prop.
// This avoids the double-source-of-truth bug where AroundYouTab and Home
// could be reading different indices from the context simultaneously.
const AroundYouTab = ({ profile, onViewProfile, actionMessage }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const router = useRouter();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // Reset image carousel to first photo whenever the displayed profile changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [profile?._id, profile?.id]);

  if (!profile) return null;

  // ── Build clean URI array ─────────────────────────────────────────────────
  const rawImages       = Array.isArray(profile.images) ? profile.images : [];
  const imageUris       = rawImages.map(extractImageUri).filter(Boolean);
  const totalImages     = imageUris.length || 1;
  // Clamp index — prevents out-of-bounds if images array shrinks between renders
  const safeIndex       = Math.min(currentImageIndex, totalImages - 1);
  const currentImageUri = imageUris[safeIndex] || FALLBACK_PROFILE_IMAGE;

  const locationText = formatLocation(profile.location);

  const formatDisplayName = (fullName) => {
    const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
    return parts.length === 0 ? "Unknown" : parts[0];
  };
  const displayName = formatDisplayName(profile.name);

  // ── Fade transition helper ────────────────────────────────────────────────
  const fadeTransition = (callback) => {
    Animated.timing(fadeAnim, {
      toValue:         0,
      duration:        120,
      useNativeDriver: true,
    }).start(() => {
      callback();
      Animated.timing(fadeAnim, {
        toValue:         1,
        duration:        250,
        useNativeDriver: true,
      }).start();
    });
  };

  // ── Tap left / right half to cycle through photos ─────────────────────────
  const handleTap = (event) => {
    if (totalImages <= 1) return;
    const tapX       = event.nativeEvent.locationX;
    const isRightTap = tapX > screenWidth / 2;

    fadeTransition(() => {
      if (isRightTap) {
        setCurrentImageIndex((prev) => (prev < totalImages - 1 ? prev + 1 : 0));
      } else {
        setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : totalImages - 1));
      }
    });
  };

  const handleNavigateToProfile = () => {
    const id = profile._id || profile.id;
    if (id) router.push(`/user-profile/${id}`);
  };

  return (
    <View style={[styles.tabContent, { height: screenHeight - 200 }]}>

      {/* Action message overlay (e.g. "Liked!" / "Noped!") */}
      {actionMessage ? (
        <View style={styles.actionMessage}>
          <Text style={styles.actionText}>{actionMessage}</Text>
        </View>
      ) : null}

      {/* Image pagination dots */}
      {totalImages > 1 && (
        <View style={styles.dotsContainer}>
          {Array.from({ length: totalImages }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === safeIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>
      )}

      {/* Main card */}
      <TouchableOpacity
        style={styles.imageTouchContainer}
        activeOpacity={1}
        onPress={handleTap}
      >
        <Animated.View style={[styles.imageContainer, { opacity: fadeAnim }]}>
          <Image
            source={{ uri: currentImageUri }}
            style={styles.image}
            resizeMode="cover"
          />

          <View style={styles.overlay} />

          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.85)"]}
            style={styles.bottomGradient}
          />

          {/* Profile info overlay */}
          <View style={styles.profileInfo}>
            <View style={{ flex: 1 }}>

              <View style={styles.nameRow}>
                <View style={styles.nameLeft}>
                  <View style={styles.nameAgeRow}>
                    <Text style={styles.nameText} numberOfLines={1}>
                      {displayName},
                    </Text>
                    {profile.age ? (
                      <Text style={styles.ageText}>{profile.age}</Text>
                    ) : null}
                  </View>
                  {profile.isVerified ? (
                    <View style={{ marginLeft: 6 }}>
                      <VerifiedIcon />
                    </View>
                  ) : null}
                </View>

                <TouchableOpacity
                  style={styles.profileButton}
                  onPress={handleNavigateToProfile}
                  // hitSlop={8}
                >
                  <Info size={22} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* ── Location: only rendered when we have an actual string ── */}
              {locationText ? (
                <View style={styles.locationRow}>
                  <MapPin size={16} color={colors.secondary} />
                  <Text style={styles.locationText} numberOfLines={1}>
                    {locationText}
                    {profile.distance ? `  ·  ${profile.distance}` : ""}
                  </Text>
                </View>
              ) : null}

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

  // Pagination dots
  dotsContainer: {
    position:       "absolute",
    top:            50,
    left:           16,
    right:          16,
    flexDirection:  "row",
    gap:            4,
    zIndex:         20,
    justifyContent: "center",
  },
  dot: {
    flex:         1,
    height:       3,
    borderRadius: 2,
  },
  dotActive:   { backgroundColor: "#fff" },
  dotInactive: { backgroundColor: "rgba(255,255,255,0.35)" },

  imageTouchContainer: {
    flex:     1,
    overflow: "hidden",
  },
  imageContainer: {
    flex:     1,
    position: "relative",
  },
  image: {
    width:  "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.12)",
  },
  actionMessage: {
    position:          "absolute",
    top:               100,
    alignSelf:         "center",
    zIndex:            50,
    backgroundColor:   "rgba(255,255,255,0.9)",
    paddingHorizontal: 20,
    paddingVertical:   10,
    borderRadius:      20,
    borderWidth:       1,
    borderColor:       "rgba(0,0,0,0.05)",
  },
  actionText: {
    color:      "#333",
    fontSize:   16,
    fontWeight: "600",
  },
  bottomGradient: {
    position: "absolute",
    bottom:   0,
    left:     0,
    right:    0,
    height:   220,
  },
  profileInfo: {
    position: "absolute",
    bottom:   120,
    left:     20,
    right:    20,
    zIndex:   10,
  },
  nameRow: {
    flexDirection:  "row",
    justifyContent: "space-between",
    alignItems:     "center",
    marginBottom:   4,
  },
  nameLeft: {
    flexDirection: "row",
    alignItems:    "center",
    flex:          1,
  },
  nameAgeRow: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           8,
  },
  nameText: {
    color:         "#fff",
    fontSize:      36,
    fontFamily:    "PlusJakartaSansBold",
    textTransform: "capitalize",
  },
  ageText: {
    color:      "#fff",
    fontSize:   30,
    fontFamily: "PlusJakartaSansMedium",
  },
  locationRow: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           4,
    marginTop:     -2,
  },
  locationText: {
    color:      "rgba(255,255,255,0.9)",
    fontSize:   15,
    fontFamily: "PlusJakartaSansMedium",
    flex:       1,
  },
  profileButton: {
    width:           48,
    height:          48,
    borderRadius:    24,
    justifyContent:  "center",
    alignItems:      "center",
    backgroundColor: "rgba(255,255,255,0.20)",
  },
});

export default AroundYouTab;