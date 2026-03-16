import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSelector } from "react-redux";
import ActionButtons from "../../../components/homeScreen/ActionButtons";
import ProfileCard from "../../../components/homeScreen/ProfileCard";
import ComplimentModal from "../../../components/modals/ComplimentModal";
import MatchCelebrationModal from "../../../components/modals/MatchCelebrationModal";
import BackArrow from "../../../components/ui/BackArrow";
import VerifiedIcon from "../../../components/ui/VerifiedIcon";
import { colors } from "../../../constant/colors";
import { useProfile } from "../../../context/ProfileContext";
import { matchService } from "../../../services/matchService";
import { messageService } from "../../../services/messageService";
import { profileService } from "../../../services/profileService";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// ─── Interaction states ───────────────────────────────────────────────────────
// 'unknown'  — haven't checked yet
// 'none'     — no previous interaction, show action buttons
// 'liked'    — already liked this person
// 'passed'   — already passed on this person
// 'matched'  — it's a mutual match
// 'superliked' — already superliked

const INTERACTION_LABEL = {
  liked:      { emoji: '❤️', text: 'You liked this person',      color: '#E8651A' },
  superliked: { emoji: '⭐', text: 'You super liked this person', color: '#6366F1' },
  passed:     { emoji: '👎', text: 'You passed on this person',   color: '#9CA3AF' },
  matched:    { emoji: '🎉', text: 'You matched!',                color: '#22C55E' },
};

// ─── Already-interacted banner ────────────────────────────────────────────────

const InteractionBanner = ({ status }) => {
  const meta = INTERACTION_LABEL[status];
  if (!meta) return null;

  return (
    <View style={[ib.wrap, { backgroundColor: meta.color }]}>
      <Text style={ib.emoji}>{meta.emoji}</Text>
      <Text style={ib.text}>{meta.text}</Text>
    </View>
  );
};

const ib = StyleSheet.create({
  wrap: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 50,
    paddingVertical: 14,
    paddingHorizontal: 20,
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  emoji: { fontSize: 20 },
  text:  { color: '#fff', fontFamily: 'PlusJakartaSansBold', fontSize: 14, flex: 1 },
});

// ─────────────────────────────────────────────────────────────────────────────

const UserProfile = () => {
  const { id, showActions } = useLocalSearchParams();
  const router = useRouter();
  const { handleHomeSwipe, handleHomeSuperLike, homeProfiles, matchCelebration, setMatchCelebration } = useProfile();
  const { user: currentUser } = useSelector((state) => state.auth);

  const [flashMessage, setFlashMessage]       = useState(null);
  const [currentProfile, setCurrentProfile]   = useState(null);
  const [loadingProfile, setLoadingProfile]   = useState(true);
  const [interactionStatus, setInteractionStatus] = useState('unknown');
  const [showComplimentModal, setShowComplimentModal] = useState(false);
  // 'unknown' | 'none' | 'liked' | 'passed' | 'superliked' | 'matched'

  const animation  = useSharedValue(1);
  const flashAnim  = useSharedValue(0);
  const scrollY    = useSharedValue(0);
  const scrollRef  = useRef(null);

  // ── Helpers ────────────────────────────────────────────────

  const normalizeImages = (images) => {
    if (!Array.isArray(images)) return [];
    return images
      .map((image) => {
        if (typeof image === "string") return image;
        if (!image || typeof image !== "object") return null;
        return (
          image.url || image.uri || image.secure_url ||
          image.imageUrl || image.image || image.src || null
        );
      })
      .filter(Boolean);
  };

  const formatLocation = (location) => {
    if (!location || typeof location !== "object") return location || "";
    return [location.city, location.state, location.country].filter(Boolean).join(", ");
  };

  const formatDistance = (profile) => {
    const d = profile?.distance ?? profile?.distanceText ?? profile?.distanceLabel ?? profile?.location?.distance;
    if (typeof d === "string")  return d.trim();
    if (typeof d === "number" && Number.isFinite(d)) return `${d} km`;
    const km = profile?.distanceKm ?? profile?.distanceInKm;
    if (typeof km === "number" && Number.isFinite(km)) return `${km} km`;
    if (typeof km === "string" && km.trim()) return km.trim().toLowerCase().includes("km") ? km.trim() : `${km.trim()} km`;
    return "";
  };

  const normalizeProfile = (profile) => {
    const normalizedImages = normalizeImages(profile?.images);
    return {
      id:                 profile?._id ?? profile?.id,
      _id:                profile?._id ?? profile?.id,
      firstName:          profile?.firstName,
      name:               profile?.name || [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || "Unknown",
      age:                profile?.age ?? null,
      gender:             profile?.gender,
      voicePrompt:       profile?.voicePrompt,
      zodiac:             profile?.zodiacSign ?? profile?.zodiac,
      location:           formatLocation(profile?.location) || profile?.location,
      distance:           formatDistance(profile),
      bondScore:          profile?.bondScore,
      verified:           profile?.verified ?? profile?.isVerified ?? false,
      occupation:         profile?.occupation,
      completion:         profile?.completionPercentage ?? profile?.completion,
      religion:           profile?.religion,
      education:          profile?.education,
      school:             profile?.school,
      height:             profile?.height,
      loveStyle:          profile?.loveLanguage ?? profile?.loveStyle,
      communicationStyle: profile?.communicationStyle,
      financialStyle:     profile?.financialStyle,
      lookingFor:         profile?.lookingFor,
      relationshipType:   profile?.relationshipType,
      drinking:           profile?.drinking,
      smoking:            profile?.smoking,
      exercise:           profile?.exercise,
      pets:               profile?.pets,
      children:           profile?.children,
      joined:             profile?.joined,
      language:           profile?.languages ?? profile?.language ?? [],
      nationality:        profile?.nationality,
      ethnicity:          profile?.ethnicity,
      mutualFriends:      profile?.mutualFriends ?? 0,
      mutualInterests:    profile?.mutualInterests ?? [],
      interests:          profile?.interests ?? [],
      personalities:      profile?.personalities ?? [],
      bio:                profile?.bio ?? "",
      questions:          profile?.questions ?? [],
      images:             normalizedImages.length > 0 ? normalizedImages : [],
    };
  };

  // ── Load profile ────────────────────────────────────────────

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        setLoadingProfile(true);

        const fromContext = homeProfiles?.find((p) => String(p.id) === String(id));
        if (fromContext) {
          if (isMounted) setCurrentProfile(normalizeProfile(fromContext));
        } else {
          const fromApi = await profileService.getProfileById(id);
          if (isMounted) setCurrentProfile(normalizeProfile(fromApi));
        }
      } catch {
        if (isMounted) setCurrentProfile(null);
      } finally {
        if (isMounted) setLoadingProfile(false);
      }
    };

    if (id) loadProfile();
    else setLoadingProfile(false);

    return () => { isMounted = false; };
  }, [id, homeProfiles]);

  // ── Check prior interaction with this user ──────────────────
  // We call matchService to see if a like/pass/match record exists.
  // Falls back gracefully if the endpoint is unavailable.

  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    const checkInteraction = async () => {
      try {
        // matchService.getInteractionStatus(userId) should return:
        // { status: 'liked' | 'passed' | 'superliked' | 'matched' | 'none' }
        const result = await matchService.getInteractionStatus(id);
        if (isMounted) {
          setInteractionStatus(result?.status ?? 'none');
        }
      } catch {
        // If endpoint doesn't exist yet, default to showing buttons
        if (isMounted) setInteractionStatus('none');
      }
    };

    checkInteraction();
    return () => { isMounted = false; };
  }, [id]);

  // ── Animation ───────────────────────────────────────────────

  useEffect(() => {
    animation.value = 0;
    animation.value = withTiming(1, { duration: 600 });
  }, [id]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => { scrollY.value = event.contentOffset.y; },
  });

  // ── Flash message ────────────────────────────────────────────

  const showFlashMessage = (direction) => {
    const message = direction === "right" ? "Liked ❤️" : "Passed 👎";
    setFlashMessage(message);
    flashAnim.value = 0;
    flashAnim.value = withTiming(1, { duration: 300 }, () => {
      flashAnim.value = withTiming(0, { duration: 300, delay: 400 }, () => {
        runOnJS(setFlashMessage)(null);
      });
    });
  };

  // ── Swipe handlers — mark as interacted then hide buttons ───

  const handleSwipe = (direction) => {
    if (!currentProfile) return;
    showFlashMessage(direction);

    // Immediately update local status so buttons disappear right away
    setInteractionStatus(direction === 'right' ? 'liked' : 'passed');

    setTimeout(() => {
      handleHomeSwipe(direction, currentProfile);
      router.back();
    }, 800);
  };

  const handleSuperLike = () => {
    if (!currentProfile) return;
    showFlashMessage("right");
    setInteractionStatus('superliked');

    setTimeout(() => {
      handleHomeSuperLike(currentProfile);
      router.back();
    }, 800);
  };

  const handleCompliment = () => {
    if (!currentProfile) return;
    setShowComplimentModal(true);
  };

  // ── Animated styles ─────────────────────────────────────────

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(animation.value, [0, 1], [60, 0]) },
      { scale:      interpolate(animation.value, [0, 1], [0.9, 1]) },
    ],
    opacity: animation.value,
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashAnim.value,
    transform: [{ translateY: interpolate(flashAnim.value, [0, 1], [-20, 0]) }],
  }));

  const profileHeaderStyle = useAnimatedStyle(() => ({
    opacity:   interpolate(scrollY.value, [0, 60], [0, 1], "clamp"),
    transform: [{ translateY: interpolate(scrollY.value, [0, 50], [-20, 0], "clamp") }],
  }));

  const staticHeaderStyle = useAnimatedStyle(() => ({
    opacity:   interpolate(scrollY.value, [0, 60], [1, 0], "clamp"),
    transform: [{ translateY: interpolate(scrollY.value, [0, 50], [0, -20], "clamp") }],
  }));

  // ── Derived ─────────────────────────────────────────────────

  // Show action buttons only when:
  //  1. showActions param is not "false"
  //  2. No blocking interaction (matched profiles can't be changed)
  //  3. Allow changing passes to likes
  const hasBlockingInteraction = ['liked', 'superliked', 'matched'].includes(interactionStatus);
  const shouldShowActions = showActions !== "false" && !hasBlockingInteraction && interactionStatus !== 'unknown';

  // ── Loading / error ─────────────────────────────────────────

  if (loadingProfile) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!currentProfile) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <Text className="text-white">Profile not found.</Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      {/* Static header (fades out on scroll) */}
      <Animated.View style={[styles.staticHeader, staticHeaderStyle]}>
        <View style={styles.staticHeaderRow}>
          <Pressable onPress={() => router.back()} style={styles.staticBackButton}>
            <View style={styles.backButtonCircle}>
              <ChevronLeft size={24} color="#FFF" />
            </View>
          </Pressable>
        </View>
      </Animated.View>

      {/* Animated header (appears on scroll) */}
      <Animated.View style={[styles.profileHeader, profileHeaderStyle]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.leftIcon}>
            <BackArrow color="#000" />
          </Pressable>
          <View style={styles.centerContent}>
            <View className="flex-row items-center gap-1">
              <View className="flex-row items-center">
                <Text className="text-black text-2xl font-PlusJakartaSansBold mr-2 capitalize" numberOfLines={1}>
                  {currentProfile.name}
                </Text>
                <Text className="text-black text-2xl font-PlusJakartaSans">
                  {currentProfile.age}
                </Text>
              </View>
              {currentProfile.verified && <VerifiedIcon style={{ width: 18 }} />}
            </View>
          </View>
          <View style={styles.rightSpacer} />
        </View>
      </Animated.View>

      {/* Flash message */}
      {flashMessage && (
        <Animated.View style={[styles.flashMessage, flashStyle]}>
          <Text style={styles.flashText}>{flashMessage}</Text>
        </Animated.View>
      )}

      {/* Profile content */}
      <Animated.ScrollView
        ref={scrollRef}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: interactionStatus !== 'none' && interactionStatus !== 'unknown' ? 180 : shouldShowActions ? 120 : 0 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ flex: 1 }}>
          <ProfileCard profile={currentProfile} hideAiSuggestion={interactionStatus === 'matched'} />
        </Animated.View>
      </Animated.ScrollView>

      {/* Action buttons — shown for non-blocking interactions (including passed) */}
      {shouldShowActions && (
        <View style={styles.actionButtonWrapper}>
          <ActionButtons onSwipe={handleSwipe} onCompliment={handleCompliment} />
        </View>
      )}

      {/* Compliment modal */}
      <ComplimentModal
        visible={showComplimentModal}
        onClose={() => setShowComplimentModal(false)}
        targetUser={currentProfile}
        currentUser={currentUser}
        onViewNextProfile={() => setShowComplimentModal(false)}
      />

      {/* Match celebration modal */}
      <MatchCelebrationModal
        visible={!!matchCelebration}
        onClose={() => setMatchCelebration(null)}
        matchedUser={matchCelebration}
        currentUser={currentUser}
        onSendMessage={async (matchedProfile, selectedIceBreaker) => {
          if (matchedProfile?.matchId && selectedIceBreaker) {
            try {
              await messageService.sendMessage(matchedProfile.matchId, {
                content: selectedIceBreaker,
                type:    "text",
              });
            } catch (error) {
              console.error("Failed to send ice breaker:", error);
            }
          }
          setMatchCelebration(null);
        }}
        onContinueSwiping={() => setMatchCelebration(null)}
      />

      {/* Interaction banner — shown for all interactions */}
      {/* {interactionStatus !== 'none' && interactionStatus !== 'unknown' && (
        <InteractionBanner status={interactionStatus} />
      )} */}
    </View>
  );
};

const styles = StyleSheet.create({
  staticHeader: {
    position: "absolute", top: 60, left: 0, right: 0,
    paddingHorizontal: 15, zIndex: 50,
  },
  staticHeaderRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", width: "100%",
  },
  staticBackButton: { width: 40, justifyContent: "center", alignItems: "flex-start" },
  backButtonCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center", alignItems: "center",
  },
  profileHeader: {
    position: "absolute", top: 0, left: 0, right: 0,
    backgroundColor: "white", paddingTop: 60, paddingBottom: 15,
    alignItems: "center", zIndex: 40,
    borderBottomWidth: 1, borderBottomColor: "#f0f0f0",
  },
  headerRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", width: "100%", paddingHorizontal: 15,
  },
  leftIcon:     { width: 40, justifyContent: "center", alignItems: "flex-start" },
  centerContent:{ flex: 1, alignItems: "center" },
  rightSpacer:  { width: 40 },
  actionButtonWrapper: {
    position: "absolute", bottom: 10, left: 0, right: 0, zIndex: 10,
  },
  flashMessage: {
    position: "absolute", top: 100, alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingVertical: 8, paddingHorizontal: 16,
    borderRadius: 20, zIndex: 100,
  },
  flashText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});

export default UserProfile;