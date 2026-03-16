import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Progress from "react-native-progress";
import { getProfileAge } from "../../utils/ageHelper";
import apiClient from "../../utils/axiosInstance";
import VerifiedIcon from "../ui/VerifiedIcon";
import {colors} from "../../constant/colors";

const PRIMARY = colors.secondary;   // your orange e.g. '#E8521A' --- IGNORE ---
const PHOTO_SIZE     = 130;
const RING_THICKNESS = 5;
const RING_GAP       = 4;
const CIRCLE_SIZE    = PHOTO_SIZE + (RING_THICKNESS + RING_GAP) * 2; // 148
const BADGE_OFFSET   = 10; // how far the % badge extends below the ring

const ProfileSection = ({ profile, isUploading }) => {
  const completion   = Math.min(profile?.completionPercentage || 0, 100);
  const profileImage =
    profile?.images?.[0]?.url ||
    profile?.images?.[0]       ||
    profile?.profilePhoto      ||
    "";
  const displayAge = getProfileAge(profile);
  const router     = useRouter();

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
      {/* ── Circular progress ring + photo ── */}
      <View style={styles.circleProgressContainer}>
        {/* Ring */}
        <Progress.Circle
          size={CIRCLE_SIZE}
          progress={completion / 100}
          color={PRIMARY}
          unfilledColor={`${PRIMARY}25`}
          borderWidth={0}
          thickness={RING_THICKNESS}
          strokeCap="round"
          animated
        />

        {/* Profile photo centred inside the ring */}
        <View style={styles.photoInRing}>
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

        {/* Percentage badge anchored to the bottom of the ring */}
        <View style={styles.percentBadge}>
          <Text style={styles.percentBadgeText}>{completion}%</Text>
        </View>
      </View>

      {/* ── Name ── */}
      <View style={styles.nameRow}>
        <Text style={styles.nameText} numberOfLines={1}>
          {profile?.firstName || "Your Profile"}
          {displayAge ? `, ${displayAge}` : ""}
        </Text>
        {profile?.verified && <VerifiedIcon />}
      </View>

      {/* ── Completion hint ── */}
      <Text style={styles.completionSub}>Get more matches with a full profile</Text>

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
    shadowColor:       "#000",
    shadowOpacity:     0.08,
    shadowRadius:      16,
    shadowOffset:      { width: 0, height: 4 },
    elevation:         6,
    paddingBottom:     20,
    alignItems:        "center",
  },

  // Circular progress ring container
  circleProgressContainer: {
    marginTop:       28,
    width:           CIRCLE_SIZE,
    height:          CIRCLE_SIZE,
    alignItems:      "center",
    justifyContent:  "center",
  },

  // Profile photo centred inside the ring
  photoInRing: {
    position:        "absolute",
    top:             (CIRCLE_SIZE - PHOTO_SIZE) / 2,
    left:            (CIRCLE_SIZE - PHOTO_SIZE) / 2,
    width:           PHOTO_SIZE,
    height:          PHOTO_SIZE,
    borderRadius:    PHOTO_SIZE / 2,
    overflow:        "hidden",
    backgroundColor: "#e5e7eb",
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

  // Percentage badge anchored to the bottom of the ring
  percentBadge: {
    position:          "absolute",
    bottom:            -BADGE_OFFSET,
    backgroundColor:   PRIMARY,
    paddingHorizontal: 10,
    paddingVertical:   3,
    borderRadius:      20,
  },
  percentBadgeText: {
    color:      "#fff",
    fontSize:   11,
    fontFamily: "PlusJakartaSansBold",
  },

  // Name
  nameRow: {
    flexDirection:     "row",
    alignItems:        "center",
    gap:               8,
    marginTop:         20,
    paddingHorizontal: 24,
  },
  nameText: {
    fontSize:      28,
    fontFamily:    "PlusJakartaSansBold",
    color:         "#111",
    textTransform: "capitalize",
    flexShrink:    1,
  },

  // Completion hint
  completionSub: {
    fontSize:     12,
    fontFamily:   "PlusJakartaSans",
    color:        "#9CA3AF",
    marginTop:    10,
    marginBottom: 4,
    paddingHorizontal: 20,
    textAlign:    "center",
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