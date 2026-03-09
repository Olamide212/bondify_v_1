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
import { getProfileAge } from "../../utils/ageHelper";
import apiClient from "../../utils/axiosInstance";
import VerifiedIcon from "../ui/VerifiedIcon";

const PRIMARY = "#E8651A";
const INDIGO  = "#6366F1";
const PHOTO_SIZE = 130;

const ProfileSection = ({ profile, isUploading }) => {
  const completion   = profile?.completionPercentage || 0;
  const profileImage =
    profile?.images?.[0]?.url ||
    profile?.images?.[0]       ||
    profile?.profilePhoto      ||
    "";
  const displayAge = getProfileAge(profile);
  const router     = useRouter();

  // ── Live stats ──────────────────────────────────────────────────────────────
  const [stats, setStats]           = useState({ matches: 0, likes: 0, profileViews: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchStats = async () => {
      try {
        const res = await apiClient.get("/profile/stats");
        const data = res.data?.data ?? res.data ?? {};
        if (mounted) {
          setStats({
            matches:      data.matches      ?? 0,
            likes:        data.likes        ?? 0,
            profileViews: data.profileViews ?? 0,
          });
        }
      } catch {
        // silently keep zeros — non-critical UI
      } finally {
        if (mounted) setStatsLoading(false);
      }
    };
    fetchStats();
    return () => { mounted = false; };
  }, []);

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      onPress={() => router.push("/profile")}
      style={styles.card}
    >
      {/* ── Circular profile photo ── */}
      <View style={styles.photoWrapper}>
        {profileImage ? (
          <>
            <Image
              source={{ uri: profileImage }}
              style={styles.photo}
              resizeMode="cover"
            />
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

      {/* ── Name + verified ── */}
      <View style={styles.nameRow}>
        <Text style={styles.nameText} numberOfLines={1}>
          {profile?.firstName || "Your Profile"}
          {displayAge ? `, ${displayAge}` : ""}
        </Text>
        {profile?.verified && <VerifiedIcon />}
      </View>

      {/* ── Profile completion bar ── */}
      <View style={styles.completionSection}>
        <View style={styles.completionHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.completionTitle}>Profile Completion</Text>
            <Text style={styles.completionSub}>
              Get more matches with a full profile
            </Text>
          </View>
          <Text style={styles.completionPct}>{completion}%</Text>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.min(completion, 100)}%` }]} />
        </View>
      </View>

      {/* ── Stats row ── */}
      <View style={styles.statsRow}>
        {[
          { value: stats.matches,      label: "MATCHES"      },
          { value: stats.likes,        label: "LIKES"        },
          { value: stats.profileViews, label: "PROFILE VIEWS" },
        ].map(({ value, label }, i) => (
          <View
            key={label}
            style={[styles.statChip, i > 0 && styles.statChipBorder]}
          >
            {statsLoading ? (
              <ActivityIndicator size="small" color={PRIMARY} />
            ) : (
              <Text style={styles.statValue}>{value}</Text>
            )}
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
    backgroundColor:  "#fff",
    borderRadius:     24,
    marginHorizontal: 16,
    marginTop:        16,
    overflow:         "hidden",
    shadowColor:      "#000",
    shadowOpacity:    0.08,
    shadowRadius:     16,
    shadowOffset:     { width: 0, height: 4 },
    elevation:        6,
    paddingBottom:    20,
    alignItems:       "center",
  },

  // ── Photo ────────────────────────────────────────────────────────────────
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
  photoPlaceholder: {
    backgroundColor: "#d1d5db",
  },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems:      "center",
    justifyContent:  "center",
  },

  // ── Name ─────────────────────────────────────────────────────────────────
  nameRow: {
    flexDirection:  "row",
    alignItems:     "center",
    gap:            8,
    marginTop:      16,
    paddingHorizontal: 24,
  },
  nameText: {
    fontSize:      28,
    fontFamily:    "PlusJakartaSansBold",
    color:         "#111",
    textTransform: "capitalize",
    flexShrink:    1,
  },

  // ── Completion ────────────────────────────────────────────────────────────
  completionSection: {
    width:          "100%",
    paddingHorizontal: 20,
    paddingTop:     18,
    paddingBottom:  16,
  },
  completionHeader: {
    flexDirection:  "row",
    justifyContent: "space-between",
    alignItems:     "flex-start",
    marginBottom:   10,
  },
  completionTitle: {
    fontSize:   14,
    fontFamily: "PlusJakartaSansBold",
    color:      INDIGO,
  },
  completionSub: {
    fontSize:   12,
    fontFamily: "PlusJakartaSans",
    color:      "#9CA3AF",
    marginTop:  2,
  },
  completionPct: {
    fontSize:   20,
    fontFamily: "PlusJakartaSansBold",
    color:      PRIMARY,
  },
  track: {
    height:          6,
    borderRadius:    99,
    backgroundColor: "#E5E7EB",
    overflow:        "hidden",
  },
  fill: {
    height:          "100%",
    borderRadius:    99,
    backgroundColor: PRIMARY,
    maxWidth:        "100%",
  },

  // ── Stats ─────────────────────────────────────────────────────────────────
  statsRow: {
    flexDirection:    "row",
    width:            "100%",
    marginHorizontal: 0,
    paddingHorizontal: 20,
    gap:              0,
  },
  statChip: {
    flex:            1,
    paddingVertical: 14,
    alignItems:      "center",
    justifyContent:  "center",
    backgroundColor: "#FAFAFA",
    borderRadius:    16,
    borderWidth:     1,
    borderColor:     "#F3F4F6",
    minHeight:       64,
  },
  statChipBorder: {
    marginLeft: 10,
  },
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