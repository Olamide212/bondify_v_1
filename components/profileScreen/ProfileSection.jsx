import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getProfileAge } from "../../utils/ageHelper";
import apiClient from "../../utils/axiosInstance";
import VerifiedIcon from "../ui/VerifiedIcon";

const PRIMARY    = "#E8651A";
const PHOTO_SIZE = 130;
const TRACK_H_PADDING = 20; // must match completionSection paddingHorizontal

const ProfileSection = ({ profile, isUploading }) => {
  const completion   = Math.min(profile?.completionPercentage || 0, 100);
  const profileImage =
    profile?.images?.[0]?.url ||
    profile?.images?.[0]       ||
    profile?.profilePhoto      ||
    "";
  const displayAge = getProfileAge(profile);
  const router     = useRouter();

  // ── Track width (measured on layout so badge offset is pixel-accurate) ──
  const [trackWidth, setTrackWidth] = useState(0);

  // ── Animated fill value 0→100 ───────────────────────────────────────────
  const fillAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue:         completion,
      duration:        700,
      useNativeDriver: false,
    }).start();
  }, [completion]);

  // Badge slides from left:0 to left:(trackWidth - BADGE_WIDTH)
  const BADGE_W = 38;
  const badgeLeft = trackWidth
    ? fillAnim.interpolate({
        inputRange:  [0, 100],
        outputRange: [0, trackWidth - BADGE_W],
        extrapolate: "clamp",
      })
    : 0;

  // ── Live stats ───────────────────────────────────────────────────────────
  const [stats, setStats]               = useState({ matches: 0, likes: 0, profileViews: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res  = await apiClient.get("/profile/stats");
        const data = res.data?.data ?? res.data ?? {};
        if (mounted) {
          setStats({
            matches:      data.matches      ?? 0,
            likes:        data.likes        ?? 0,
            profileViews: data.profileViews ?? 0,
          });
        }
      } catch { /* keep zeros */ }
      finally { if (mounted) setStatsLoading(false); }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      onPress={() => router.push("/edit-profile")}
      style={styles.card}
    >
      {/* ── Photo ── */}
      <View style={styles.photoWrapper}>
        {profileImage ? (
          <>
            <Image source={{ uri: profileImage }} style={styles.photo} resizeMode="cover" />
            {isUploading && (
              <View style={styles.uploadOverlay}>
                <ActivityIndicator size="large" color={PRIMARY} />
              </View>
            )}
          </>
        ) : (
          <View style={[styles.photo, styles.photoPlaceholder]} />
        )}
      </View>

      {/* ── Name ── */}
      <View style={styles.nameRow}>
        <Text style={styles.nameText} numberOfLines={1}>
          {profile?.firstName || "Your Profile"}
          {displayAge ? `, ${displayAge}` : ""}
        </Text>
        {profile?.verified && <VerifiedIcon />}
      </View>

      {/* ── Completion bar + sliding badge ── */}
      <View style={styles.completionSection}>
        {/* Extra space above the track so the floating badge isn't clipped */}
        <View style={styles.badgeSpace} />

        <View
          style={styles.track}
          onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
        >
          {/* Animated fill */}
          <Animated.View
            style={[
              styles.fill,
              {
                width: fillAnim.interpolate({
                  inputRange:  [0, 100],
                  outputRange: ["0%", "100%"],
                  extrapolate: "clamp",
                }),
              },
            ]}
          />

          {/* Badge — floats above the right edge of the fill */}
          {trackWidth > 0 && (
            <Animated.View style={[styles.badge, { left: badgeLeft }]}>
              <Text style={styles.badgeText}>{completion}%</Text>
            </Animated.View>
          )}
        </View>

        <Text style={styles.completionSub}>Get more matches with a full profile</Text>
      </View>

      {/* ── Stats ── */}
      <View style={styles.statsRow}>
        {[
          { value: stats.matches,      label: "MATCHES"       },
          { value: stats.likes,        label: "LIKES"         },
          { value: stats.profileViews, label: "PROFILE VIEWS" },
        ].map(({ value, label }, i) => (
          <View key={label} style={[styles.statChip, i > 0 && styles.statChipBorder]}>
            {statsLoading
              ? <ActivityIndicator size="small" color={PRIMARY} />
              : <Text style={styles.statValue}>{value}</Text>
            }
            <Text style={styles.statLabel}>{label}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
};

export default ProfileSection;

const styles = StyleSheet.create({
  card: {
    backgroundColor:   "#fff",
    borderRadius:      24,
    marginHorizontal:  16,
    marginTop:         16,
    overflow:          "hidden",
    shadowColor:       "#000",
    shadowOpacity:     0.08,
    shadowRadius:      16,
    shadowOffset:      { width: 0, height: 4 },
    elevation:         6,
    paddingBottom:     20,
    alignItems:        "center",
  },

  // Photo
  photoWrapper: {
    marginTop:        28,
    width:            PHOTO_SIZE,
    height:           PHOTO_SIZE,
    borderRadius:     PHOTO_SIZE / 2,
    overflow:         "hidden",
    borderWidth:      3,
    borderColor:      `${PRIMARY}30`,
    backgroundColor:  "#e5e7eb",
  },
  photo: {
    width:        "100%",
    height:       "100%",
    borderRadius: PHOTO_SIZE / 2,
  },
  photoPlaceholder: { backgroundColor: "#d1d5db" },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems:      "center",
    justifyContent:  "center",
  },

  // Name
  nameRow: {
    flexDirection:     "row",
    alignItems:        "center",
    gap:               8,
    marginTop:         16,
    paddingHorizontal: 24,
  },
  nameText: {
    fontSize:      28,
    fontFamily:    "PlusJakartaSansBold",
    color:         "#111",
    textTransform: "capitalize",
    flexShrink:    1,
  },

  // Completion
  completionSection: {
    width:             "100%",
    paddingHorizontal: TRACK_H_PADDING,
    paddingTop:        16,
  },
  // Reserve vertical room above the track for the floating badge
  badgeSpace: {
    height: 26,
  },
  track: {
    height:          6,
    borderRadius:    99,
    backgroundColor: "#E5E7EB",
    overflow:        "visible", // badge floats above so must NOT clip
  },
  fill: {
    height:          "100%",
    borderRadius:    99,
    backgroundColor: PRIMARY,
  },
  badge: {
    position:      "absolute",
    top:           -26,          // sits above the bar
    alignItems:    "center",
  },
  badgeText: {
    fontSize:          12,
    fontFamily:        "PlusJakartaSansBold",
    color:             "#fff",
    backgroundColor:   PRIMARY,
    paddingHorizontal: 7,
    paddingVertical:   2,
    borderRadius:      30,
    overflow:          "hidden",
  },
  completionSub: {
    fontSize:     12,
    fontFamily:   "PlusJakartaSans",
    color:        "#9CA3AF",
    marginTop:    14,
    marginBottom: 4,
  },

  // Stats
  statsRow: {
    flexDirection:     "row",
    width:             "100%",
    paddingHorizontal: 20,
  },
  statChip: {
    flex:            1,
    paddingVertical: 20,
    alignItems:      "center",
    justifyContent:  "center",
    backgroundColor: "#FAFAFA",
    borderRadius:    16,
    borderWidth:     1,
    borderColor:     "#F3F4F6",
    minHeight:       64,
    marginTop:       15,
  },
  statChipBorder: { marginLeft: 10 },
  statValue: {
    fontSize:     20,
    fontFamily:   "PlusJakartaSansBold",
    color:        "#111",
    marginBottom: 2,
  },
  statLabel: {
    fontSize:      9,
    fontFamily:    "PlusJakartaSansMedium",
    color:         "#9CA3AF",
    letterSpacing: 0.8,
  },
});