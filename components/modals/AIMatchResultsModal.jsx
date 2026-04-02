/**
 * AIMatchResultsModal.jsx
 *
 * Full-screen modal shown when the user taps "AI Find My Match".
 * Displays a loading shimmer while AI processes, then a scrollable
 * list of AI-ranked match cards with compatibility scores and reasons.
 */

import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
    Briefcase,
    ChevronRight,
    Heart,
    MapPin,
    Sparkles,
    X,
} from "lucide-react-native";
import {
    ActivityIndicator,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { colors } from "../../constant/colors";
import LoadingImage from "../ui/LoadingImage";
import BaseModal from "./BaseModal";

const { width: SW } = Dimensions.get("window");
const CARD_W = SW - 48;

// ── Score colour helper ─────────────────────────────────────────────────────
const getScoreColor = (score) => {
  if (score >= 85) return "#22C55E"; // green
  if (score >= 70) return "#F59E0B"; // amber
  return "#EF4444"; // red
};

// ── Single match card ───────────────────────────────────────────────────────
const MatchCard = ({ match, onViewProfile }) => {
  const imageUrl = match.images?.[0]?.url || match.images?.[0]?.uri || null;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onViewProfile(match._id)}
      style={styles.card}
    >
      {/* Image */}
      <View style={styles.cardImageWrap}>
        {imageUrl ? (
          <LoadingImage
            source={{ uri: imageUrl }}
            style={styles.cardImage}
            containerStyle={styles.cardImage}
            contentFit="cover"
            indicatorColor="#fff"
          />
        ) : (
          <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
            <Heart size={32} color="#D1D5DB" />
          </View>
        )}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.65)"]}
          style={styles.cardGradient}
        />

        {/* AI Score badge */}
        <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(match.aiScore) }]}>
          <Sparkles size={12} color="#fff" />
          <Text style={styles.scoreText}>{match.aiScore}%</Text>
        </View>

        {/* Name overlay */}
        <View style={styles.cardNameOverlay}>
          <Text style={styles.cardName}>
            {match.firstName}{match.age ? `, ${match.age}` : ""}
          </Text>
          {match.verified && (
            <View style={styles.verifiedDot} />
          )}
        </View>
      </View>

      {/* Info section */}
      <View style={styles.cardBody}>
        {/* Tags row */}
        <View style={styles.tagsRow}>
          {match.occupation && (
            <View style={styles.tag}>
              <Briefcase size={12} color={colors.primary} />
              <Text style={styles.tagText} numberOfLines={1}>{match.occupation}</Text>
            </View>
          )}
          {match.city && (
            <View style={styles.tag}>
              <MapPin size={12} color={colors.primary} />
              <Text style={styles.tagText} numberOfLines={1}>{match.city}</Text>
            </View>
          )}
        </View>

        {/* AI reason */}
        <Text style={styles.aiReason} numberOfLines={2}>
          {match.aiReason}
        </Text>

        {/* View profile arrow */}
        <View style={styles.viewRow}>
          <Text style={styles.viewText}>View profile</Text>
          <ChevronRight size={16} color={colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ── Main Modal ──────────────────────────────────────────────────────────────
const AIMatchResultsModal = ({ visible, onClose, matches, loading, message }) => {
  const router = useRouter();

  const handleViewProfile = (profileId) => {
    onClose();
    // Small delay so modal closes first
    setTimeout(() => {
      router.push({ pathname: "/(root)/profile-detail", params: { id: profileId } });
    }, 300);
  };

  return (
    <BaseModal visible={visible} onClose={onClose} fullScreen>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Sparkles size={22} color={colors.primary} />
          <Text style={styles.headerTitle}>AI Matches</Text>
        </View>
        <TouchableOpacity onPress={onClose} hitSlop={12}>
          <X size={22} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Loading state */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingTitle}>Finding your best matches…</Text>
          <Text style={styles.loadingSubtitle}>
            Our AI is analyzing profiles to find people who are truly compatible with you.
          </Text>
        </View>
      )}

      {/* Results */}
      {!loading && (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Message banner */}
          {message && (
            <View style={styles.messageBanner}>
              <Sparkles size={16} color={colors.primary} />
              <Text style={styles.messageText}>{message}</Text>
            </View>
          )}

          {/* Match cards */}
          {matches?.length > 0 ? (
            matches.map((match) => (
              <MatchCard
                key={match._id}
                match={match}
                onViewProfile={handleViewProfile}
              />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={{ fontSize: 48, textAlign: "center", marginBottom: 12 }}>🔍</Text>
              <Text style={styles.emptyTitle}>No matches found</Text>
              <Text style={styles.emptySubtitle}>
                Try again later — new people join every day!
              </Text>
            </View>
          )}
        </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "PlusJakartaSansBold",
    color: "#111827",
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
    fontFamily: "PlusJakartaSansBold",
    color: "#111827",
    textAlign: "center",
    marginTop: 8,
  },
  loadingSubtitle: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans",
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },

  // Scroll content
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },

  // Message banner
  messageBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: `${colors.primary}10`,
    borderRadius: 14,
    padding: 14,
    marginBottom: 4,
  },
  messageText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "PlusJakartaSansMedium",
    color: "#374151",
    lineHeight: 20,
  },

  // Card
  card: {
    width: CARD_W,
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardImageWrap: {
    width: "100%",
    height: 260,
    position: "relative",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  cardImagePlaceholder: {
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
  },
  cardGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  scoreBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  scoreText: {
    fontSize: 13,
    fontFamily: "PlusJakartaSansBold",
    color: "#fff",
  },
  cardNameOverlay: {
    position: "absolute",
    bottom: 12,
    left: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardName: {
    fontSize: 20,
    fontFamily: "PlusJakartaSansBold",
    color: "#fff",
  },
  verifiedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#3B82F6",
  },

  // Card body
  cardBody: {
    padding: 14,
    gap: 10,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: `${colors.primary}10`,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 12,
    fontFamily: "PlusJakartaSansMedium",
    color: "#374151",
    maxWidth: 120,
  },
  aiReason: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans",
    color: "#6B7280",
    lineHeight: 19,
  },
  viewRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 2,
    paddingTop: 4,
  },
  viewText: {
    fontSize: 13,
    fontFamily: "PlusJakartaSansMedium",
    color: colors.primary,
  },

  // Empty
  emptyContainer: {
    paddingTop: 60,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "PlusJakartaSansBold",
    color: "#111827",
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans",
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
});

export default AIMatchResultsModal;
