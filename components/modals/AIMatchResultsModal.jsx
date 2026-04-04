/**
 * AIMatchResultsModal.jsx
 *
 * Full-screen modal shown when the user taps "AI Find My Match".
 * Displays a 2-column grid of AI-ranked match cards (same style as
 * the Liked You / You Liked screens) with AI score badges.
 */

import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Wand2, X } from "lucide-react-native";
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    ImageBackground,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { colors } from "../../constant/colors";
import BaseModal from "./BaseModal";

const { width: SW } = Dimensions.get("window");
const CARD_W = (SW - 48) / 2;

// ── Score colour helper ─────────────────────────────────────────────────────
const getScoreColor = (score) => {
  if (score >= 85) return "#22C55E";
  if (score >= 70) return "#F59E0B";
  return "#EF4444";
};

// ── Extract image URL from image object or string ───────────────────────────
const getImageUrl = (image) => {
  if (typeof image === "string") return image;
  if (image && typeof image === "object")
    return image.url || image.uri || image.secure_url || null;
  return null;
};

// ── Single grid card (matches UsersProfileCard style) ───────────────────────
const AIGridCard = ({ match, onPress }) => {
  const imageUrl =
    match.images?.length > 0 ? getImageUrl(match.images[0]) : null;
  const imageSource = imageUrl
    ? { uri: imageUrl }
    : { uri: "https://via.placeholder.com/150" };

  const name = match.firstName || match.name || "Unknown";
  const age = match.age;
  const occupation = match.occupation;
  const city =
    match.city ||
    (typeof match.location === "object" ? match.location?.city : null);

  return (
    <View style={styles.cardContainer}>
      <TouchableOpacity
        style={styles.touchable}
        onPress={() => onPress(match._id)}
        activeOpacity={0.9}
      >
        <ImageBackground
          source={imageSource}
          style={styles.image}
          resizeMode="cover"
        >
          {/* AI Score badge */}
          <View
            style={[
              styles.scoreBadge,
              { backgroundColor: getScoreColor(match.aiScore) },
            ]}
          >
            <Text style={styles.scoreText}>{match.aiScore}%</Text>
          </View>

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
                {name}
                {age ? `, ${age}` : ""}
              </Text>

              {occupation && (
                <Text style={styles.detail} numberOfLines={1}>
                  {occupation}
                </Text>
              )}

              {city && (
                <Text style={styles.detail} numberOfLines={1}>
                  📍 {city}
                </Text>
              )}

              {match.aiReason && (
                <Text style={styles.aiReason} numberOfLines={2}>
                  ✨ {match.aiReason}
                </Text>
              )}
            </View>
          </LinearGradient>
        </ImageBackground>
      </TouchableOpacity>
    </View>
  );
};

// ── Main Modal ──────────────────────────────────────────────────────────────
const AIMatchResultsModal = ({
  visible,
  onClose,
  matches,
  loading,
  message,
}) => {
  const router = useRouter();

  const handleViewProfile = (profileId) => {
    onClose();
    setTimeout(() => {
      router.push({
        pathname: "/(root)/profile-detail",
        params: { id: profileId },
      });
    }, 300);
  };

  return (
    <BaseModal visible={visible} onClose={onClose} fullScreen contentBackground={{ backgroundColor: "#121212" }}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Wand2 size={22} color={colors.primary} />
          <Text style={styles.headerTitle}>AI Matches</Text>
        </View>
        <TouchableOpacity onPress={onClose} hitSlop={12}>
          <X size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Loading state */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingTitle}>Finding your best matches…</Text>
          <Text style={styles.loadingSubtitle}>
            Our AI is analyzing profiles to find people who are truly compatible
            with you.
          </Text>
        </View>
      )}

      {/* Results */}
      {!loading && (
        <View style={styles.tabContent}>
          {/* Banner */}
          <LinearGradient
            colors={[colors.primary, "#A855F7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.banner}
          >
            <Text style={styles.bannerTitle}>
              {message || `✨ ${matches?.length || 0} AI-picked matches for you!`}
            </Text>
            <Text style={styles.bannerSubtitle}>
              Ranked by compatibility with your profile.
            </Text>
          </LinearGradient>

          {/* Grid */}
          {matches?.length > 0 ? (
            <FlatList
              data={matches}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <AIGridCard match={item} onPress={handleViewProfile} />
              )}
              numColumns={2}
              contentContainerStyle={styles.listContent}
              columnWrapperStyle={styles.columnWrapper}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text
                style={{
                  fontSize: 48,
                  textAlign: "center",
                  marginBottom: 12,
                }}
              >
                🔍
              </Text>
              <Text style={styles.emptyTitle}>No matches found</Text>
              <Text style={styles.emptySubtitle}>
                Try again later — new people join every day!
              </Text>
            </View>
          )}
        </View>
      )}
    </BaseModal>
  );
};

// ── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    // borderBottomWidth: 1,
    // borderBottomColor: "#f1f1f1",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "OutfitBold",
    color: "#fff",
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    gap: 16,
  },
  loadingTitle: {
    fontSize: 18,
    fontFamily: "OutfitBold",
    color: "#fff",
    textAlign: "center",
    marginTop: 8,
  },
  loadingSubtitle: {
    fontSize: 14,
    fontFamily: "Outfit",
    color: "#fff",
    textAlign: "center",
    lineHeight: 20,
  },

  // Content
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
    fontFamily: "OutfitBold",
    marginBottom: 4,
  },
  bannerSubtitle: {
    color: "white",
    fontSize: 14,
    fontFamily: "OutfitMedium",
  },
  listContent: {
    alignItems: "center",
    paddingBottom: 100,
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: 16,
  },

  // Card — matches UsersProfileCard style
  cardContainer: {
    width: CARD_W,
    height: 270,
    marginHorizontal: 0,
  },
  touchable: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#121212",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
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
  aiReason: {
    color: "#fff",
    fontSize: 10,
    opacity: 0.85,
    marginTop: 2,
    fontStyle: "italic",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 5,
  },

  // Score badge
  scoreBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  scoreText: {
    fontSize: 11,
    fontFamily: "OutfitBold",
    color: "#fff",
  },

  // Empty
  emptyContainer: {
    paddingTop: 60,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "OutfitBold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "Outfit",
    color: "#fff",
    textAlign: "center",
    lineHeight: 20,
  },
});

export default AIMatchResultsModal;
