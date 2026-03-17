/**
 * SocialProfileTab.jsx
 *
 * Content for the "Social Profile" tab on the main profile screen.
 * This is also the Bondup social profile — shows:
 *  • Social avatar, stats, bio
 *  • My Bondups section (recent active Bondups)
 *  • Menu: Edit Profile, Saved Posts, Settings, Help, Invite Friends
 */

import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import {
    Bookmark,
    ChevronRight,
    HelpCircle,
    Pencil,
    Plus,
    Settings,
    Share2,
    Users,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSelector } from "react-redux";
import { colors } from "../../constant/colors";
import feedService from "../../services/feedService";
import bondupService from "../../services/bondupService";
import apiClient from "../../utils/axiosInstance";
import EditSocialProfileModal from "./EditSocialProfileModal";

const BRAND = colors.primary;

const ACTIVITY_EMOJI = {
  coffee: '☕', food: '🍔', drinks: '🍹', gym: '💪',
  walk: '🚶', movie: '🎬', other: '✨',
};

const avatarUrl = (user) =>
  user?.profilePhoto || user?.images?.[0]?.url || user?.images?.[0] || null;

const getDisplayName = (user) =>
  user?.displayName ||
  [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
  user?.userName ||
  "User";

export default function SocialProfileTab() {
  const router = useRouter();
  const { user: currentUser } = useSelector((s) => s.auth);

  const [localAvatarUri, setLocalAvatarUri] = useState(() => avatarUrl(currentUser));
  const [uploading, setUploading] = useState(false);
  const [displayName, setDisplayName] = useState(() => getDisplayName(currentUser));
  const [userName, setUserName] = useState(currentUser?.userName ?? "");
  const [bio, setBio] = useState("");
  const [stats, setStats] = useState({ followersCount: 0, followingCount: 0, postsCount: 0 });
  const [loadingData, setLoadingData] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [myBondups, setMyBondups] = useState([]);
  const [bondupStats, setBondupStats] = useState({ created: 0, joined: 0 });
  const justPickedPhotoRef = useRef(false);

  // ── Load social profile data ─────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser?._id) return;
    setLoadingData(true);
    Promise.all([
      feedService.getSocialProfile().catch(() => null),
      feedService.getUserProfile(currentUser._id).catch(() => null),
      bondupService.getMyBondups().catch(() => null),
    ])
      .then(([socialRes, profileRes, bondupRes]) => {
        if (socialRes?.data) {
          if (!justPickedPhotoRef.current) {
            const socialPhoto = socialRes.data?.profilePhoto ?? null;
            setLocalAvatarUri(socialPhoto || avatarUrl(currentUser));
          }
          setUserName(socialRes.data?.userName ?? currentUser?.userName ?? "");
          setBio(socialRes.data?.bio ?? "");
          const apiName = socialRes.data?.displayName?.trim?.();
          if (apiName) setDisplayName(apiName);
        }
        if (profileRes?.data) {
          setStats({
            followersCount: profileRes.data.followersCount ?? 0,
            followingCount: profileRes.data.followingCount ?? 0,
            postsCount: profileRes.data.posts?.length ?? 0,
          });
        }
        if (bondupRes?.data) {
          const allBondups = bondupRes.data;
          setMyBondups(allBondups.slice(0, 3));
          setBondupStats({
            created: allBondups.filter((b) => b.isOwner).length,
            joined: allBondups.filter((b) => b.hasJoined && !b.isOwner).length,
          });
        }
      })
      .finally(() => setLoadingData(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?._id]);

  // ── Pick & upload photo ──────────────────────────────────────────────────
  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    const uri = asset.uri;
    const fileName = uri.split("/").pop() || "photo.jpg";
    const mimeType = asset.mimeType || "image/jpeg";

    justPickedPhotoRef.current = true;
    setLocalAvatarUri(uri);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("profilePhoto", { uri, name: fileName, type: mimeType });
      const res = await apiClient.post("/feed/social-profile/photo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const uploadedUrl =
        res.data?.data?.profilePhoto ??
        res.data?.data?.user?.profilePhoto ??
        res.data?.profilePhoto ??
        uri;
      setLocalAvatarUri(uploadedUrl);
      justPickedPhotoRef.current = false;
    } catch (e) {
      justPickedPhotoRef.current = false;
      setLocalAvatarUri(avatarUrl(currentUser));
      Alert.alert("Error", e?.response?.data?.message ?? "Could not update photo.");
    } finally {
      setUploading(false);
    }
  };

  // ── Menu items ───────────────────────────────────────────────────────────
  const MENU_ITEMS = [
    {
      key: "edit",
      label: "Edit Profile",
      description: "Update your name, username and bio",
      icon: Pencil,
      onPress: () => setShowEditModal(true),
    },
    {
      key: "saved",
      label: "Saved Posts",
      description: "View posts you've bookmarked",
      icon: Bookmark,
      onPress: () => router.push("/feed-profile"),
    },
    {
      key: "settings",
      label: "Settings",
      description: "Manage your preferences and privacy",
      icon: Settings,
      onPress: () => router.push("/settings"),
    },
    {
      key: "support",
      label: "Help & Support Center",
      description: "Get help, FAQs, and contact support",
      icon: HelpCircle,
      onPress: () => router.push("/support-center"),
    },
    {
      key: "invite",
      label: "Invite Friends",
      description: "Share Bondify and earn rewards",
      icon: Share2,
      onPress: () => router.push("/invite"),
    },
    {
      key: "groups",
      label: "Groups",
      description: "Browse and manage your group chats",
      icon: Users,
      onPress: () =>
        Alert.alert("Coming Soon", "Group chats will be available soon!"),
    },
  ];

  const displayAvatar = localAvatarUri || avatarUrl(currentUser);

  return (
    <View style={s.container}>
      {/* ── Profile header ──────────────────────────────────────────────── */}
      <View style={s.profileHead}>
        <TouchableOpacity
          onPress={handlePickPhoto}
          style={s.avatarWrap}
          disabled={uploading}
          activeOpacity={0.7}
        >
          {displayAvatar ? (
            <Image source={{ uri: displayAvatar }} style={s.avatar} />
          ) : (
            <View style={[s.avatar, s.avatarFallback]}>
              <Text style={s.avatarInitial}>
                {getDisplayName(currentUser)?.[0]?.toUpperCase()}
              </Text>
            </View>
          )}
          {uploading ? (
            <View style={s.uploadOverlay}>
              <ActivityIndicator size="small" color="#fff" />
            </View>
          ) : (
            <View style={s.cameraBadge}>
              <Plus size={14} color="#fff" />
            </View>
          )}
        </TouchableOpacity>

        <Text style={s.displayName}>{displayName}</Text>
        {!!userName && <Text style={s.handle}>@{userName}</Text>}
        {!!bio && <Text style={s.bio}>{bio}</Text>}

        {/* Stats */}
        {loadingData ? (
          <ActivityIndicator size="small" color={BRAND} style={{ marginTop: 16 }} />
        ) : (
          <View style={s.statsRow}>
            {[
              { value: stats.followersCount, label: "Followers" },
              { value: stats.followingCount, label: "Following" },
              { value: stats.postsCount, label: "Posts" },
            ].map(({ value, label }) => (
              <View key={label} style={s.statItem}>
                <Text style={s.statNum}>{value}</Text>
                <Text style={s.statLabel}>{label}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* ── Bondup Activity Section ──────────────────────────────────── */}
      <View style={s.bondupSection}>
        <View style={s.bondupSectionHeader}>
          <Text style={s.bondupSectionTitle}>🎉 My Bondups</Text>
          <View style={s.bondupStatsBadges}>
            <View style={s.bondupStatBadge}>
              <Text style={s.bondupStatBadgeNum}>{bondupStats.created}</Text>
              <Text style={s.bondupStatBadgeLabel}>Created</Text>
            </View>
            <View style={s.bondupStatBadge}>
              <Text style={s.bondupStatBadgeNum}>{bondupStats.joined}</Text>
              <Text style={s.bondupStatBadgeLabel}>Joined</Text>
            </View>
          </View>
        </View>
        {loadingData ? (
          <ActivityIndicator size="small" color={BRAND} style={{ marginTop: 8 }} />
        ) : myBondups.length === 0 ? (
          <Text style={s.bondupEmptyText}>No active Bondups. Create one in the feed!</Text>
        ) : (
          myBondups.map((bondup) => (
            <View key={bondup._id} style={s.bondupItem}>
              <Text style={s.bondupItemEmoji}>
                {ACTIVITY_EMOJI[bondup.activityType] || '✨'}
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={s.bondupItemTitle} numberOfLines={1}>{bondup.title}</Text>
                <Text style={s.bondupItemSub}>
                  {new Date(bondup.dateTime).toLocaleDateString(undefined, {
                    weekday: 'short', month: 'short', day: 'numeric',
                  })}
                  {bondup.isOwner ? ' • Created by you' : ' • You joined'}
                </Text>
              </View>
              <View style={[s.bondupVisibilityBadge, bondup.visibility === 'circle' && s.bondupVisibilityCircle]}>
                <Text style={s.bondupVisibilityText}>
                  {bondup.visibility === 'circle' ? '🔒' : '🌍'}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* ── Menu list ───────────────────────────────────────────────────── */}
      <View style={s.menuCard}>
        {MENU_ITEMS.map(({ key, label, description, icon: Icon, onPress }, i) => (
          <TouchableOpacity
            key={key}
            style={[s.menuItem, i < MENU_ITEMS.length - 1 && s.menuItemBorder]}
            onPress={onPress}
            activeOpacity={0.6}
          >
            <View style={s.menuIconWrap}>
              <Icon size={20} color={BRAND} />
            </View>
            <View style={s.menuTextWrap}>
              <Text style={s.menuLabel}>{label}</Text>
              <Text style={s.menuDesc}>{description}</Text>
            </View>
            <ChevronRight size={18} color="#CCC" />
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Edit modal ──────────────────────────────────────────────────── */}
      <EditSocialProfileModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        initialData={{ displayName, userName, bio }}
        onSaved={(data) => {
          if (data.displayName) setDisplayName(data.displayName);
          if (data.userName) setUserName(data.userName);
          if (data.bio !== undefined) setBio(data.bio);
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { paddingBottom: 20 },
  profileHead: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  avatarWrap: { position: "relative", marginBottom: 12 },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  avatarFallback: {
    backgroundColor: BRAND,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    color: "#fff",
    fontSize: 32,
    fontFamily: "PlusJakartaSansBold",
  },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: BRAND,
    borderRadius: 99,
    width: 26,
    height: 26,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  uploadOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 40,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  displayName: {
    fontSize: 20,
    fontFamily: "PlusJakartaSansBold",
    color: "#111",
  },
  handle: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans",
    color: "#888",
    marginTop: 2,
  },
  bio: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans",
    color: "#555",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  statsRow: {
    flexDirection: "row",
    gap: 40,
    marginTop: 18,
  },
  statItem: { alignItems: "center" },
  statNum: {
    fontSize: 18,
    fontFamily: "PlusJakartaSansBold",
    color: "#111",
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans",
    color: "#888",
  },

  // Menu
  menuCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 14,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: `${BRAND}10`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuTextWrap: { flex: 1 },
  menuLabel: {
    fontSize: 15,
    fontFamily: "PlusJakartaSansBold",
    color: "#111",
  },
  menuDesc: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans",
    color: "#999",
    marginTop: 2,
  },

  // Bondup Section
  bondupSection: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  bondupSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  bondupSectionTitle: {
    fontSize: 16,
    fontFamily: "PlusJakartaSansBold",
    color: "#111",
  },
  bondupStatsBadges: {
    flexDirection: "row",
    gap: 10,
  },
  bondupStatBadge: {
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  bondupStatBadgeNum: {
    fontSize: 16,
    fontFamily: "PlusJakartaSansBold",
    color: BRAND,
  },
  bondupStatBadgeLabel: {
    fontSize: 10,
    fontFamily: "PlusJakartaSans",
    color: BRAND,
  },
  bondupEmptyText: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans",
    color: "#999",
    textAlign: "center",
    paddingVertical: 12,
  },
  bondupItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    gap: 10,
  },
  bondupItemEmoji: {
    fontSize: 24,
  },
  bondupItemTitle: {
    fontSize: 14,
    fontFamily: "PlusJakartaSansBold",
    color: "#111",
  },
  bondupItemSub: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans",
    color: "#888",
    marginTop: 2,
  },
  bondupVisibilityBadge: {
    backgroundColor: "#F0FDF4",
    borderRadius: 8,
    padding: 4,
  },
  bondupVisibilityCircle: {
    backgroundColor: colors.primaryLight,
  },
  bondupVisibilityText: {
    fontSize: 14,
  },
});
