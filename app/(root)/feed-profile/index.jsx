/**
 * Feed Profile Screen  —  app/(root)/feed-profile/index.jsx
 *
 * Full-screen version of the Feed Profile that replaced the bottom-sheet modal.
 * Shows the user's feed social profile: avatar, username, stats, posts & saved posts.
 */

import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { ArrowLeft, Pencil, Plus } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { colors } from "../../../constant/colors";
import { useAlert } from "../../../context/AlertContext";
import bondupService from "../../../services/bondupService";
import feedService from "../../../services/feedService";
import apiClient from "../../../utils/axiosInstance";

const BRAND = colors.primary;

const avatarUrl = (user) =>
  user?.profilePhoto || user?.images?.[0]?.url || user?.images?.[0] || null;

const getDisplayName = (user) =>
  user?.displayName ||
  [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
  user?.userName ||
  "User";

export default function FeedProfileScreen() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const { user: currentUser } = useSelector((s) => s.auth);

  const [userName, setUserName] = useState(currentUser?.userName ?? "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [localAvatarUri, setLocalAvatarUri] = useState(() => currentUser?.images?.[0]?.url || null);
  const [activeTab, setActiveTab] = useState("posts");
  const [savedPosts, setSavedPosts] = useState([]);
  const [userPosts, setUserPosts] = useState([]);
  const [stats, setStats] = useState({ followersCount: 0, followingCount: 0 });
  const [loadingData, setLoadingData] = useState(false);
  const [displayNameText, setDisplayNameText] = useState(() => getDisplayName(currentUser));

  // Track whether a photo was recently picked to avoid the useEffect overwriting it
  const justPickedPhotoRef = useRef(false);

  useEffect(() => {
    if (!currentUser?._id) return;
    setLoadingData(true);
    Promise.all([
      bondupService.getSocialProfile().catch(() => null),
      feedService.getUserProfile(currentUser._id).catch(() => null),
      feedService.getSavedPosts().catch(() => null),
    ])
      .then(([socialRes, profileRes, savedRes]) => {
        if (socialRes?.data) {
          // Only update the avatar if the user didn't just pick a photo
          if (!justPickedPhotoRef.current) {
            const socialPhoto = socialRes.data?.profilePhoto ?? null;
            setLocalAvatarUri(socialPhoto || currentUser?.images?.[0]?.url || null);
          }
          setUserName(socialRes.data?.userName ?? currentUser?.userName ?? "");
          const apiDisplayName = socialRes.data?.displayName?.trim?.();
          if (apiDisplayName) {
            setDisplayNameText(apiDisplayName);
          }
        }
        if (profileRes?.data) {
          setUserPosts(profileRes.data.posts ?? []);
          setStats({
            followersCount: profileRes.data.followersCount ?? 0,
            followingCount: profileRes.data.followingCount ?? 0,
          });
        }
        if (savedRes?.data) setSavedPosts(savedRes.data);
      })
      .finally(() => setLoadingData(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?._id]);

  
  // handle pick photo, upload, and update profile photo URL
  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsEditing: false,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    const uri = asset.uri;
    const fileName = uri.split("/").pop() || "photo.jpg";
    const mimeType = asset.mimeType || "image/jpeg";

    // Show local URI immediately for better UX and prevent useEffect overwrite
    justPickedPhotoRef.current = true;
    setLocalAvatarUri(uri);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("profilePhoto", { uri, name: fileName, type: mimeType });

      const res = await apiClient.post("/bondup/social-profile/photo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const uploadedUrl =
        res.data?.data?.profilePhoto ??
        res.data?.data?.user?.profilePhoto ??
        res.data?.profilePhoto ??
        uri;

      // Keep the uploaded URL
      setLocalAvatarUri(uploadedUrl);
      // Allow future data loads to update the avatar again
      justPickedPhotoRef.current = false;
    } catch (e) {
      // Revert to original if upload fails
      justPickedPhotoRef.current = false;
      setLocalAvatarUri(avatarUrl(currentUser));
      showAlert({
        icon: 'error',
        title: 'Error',
        message: e?.response?.data?.message ?? 'Could not update photo.',
        actions: [{ label: 'OK', style: 'primary' }],
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveUsername = async () => {
    if (!userName.trim()) return;
    setSaving(true);
    try {
      await bondupService.updateSocialProfile({ userName: userName.trim() });
    } catch (e) {
      showAlert({
        icon: 'error',
        title: 'Error',
        message: e?.response?.data?.message ?? 'Could not save username.',
        actions: [{ label: 'OK', style: 'primary' }],
      });
    } finally {
      setSaving(false);
    }
  };

  const displayAvatar = localAvatarUri || avatarUrl(currentUser);
  const listData = activeTab === "posts" ? userPosts : savedPosts;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <ArrowLeft size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Feed Profile</Text>
        <TouchableOpacity
          onPress={() => router.push("/edit-user-feed-profile")}
          hitSlop={10}
          style={styles.editButton}
        >
          <Pencil size={20} color="#111" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Profile header */}
        <View style={styles.profileHead}>
          <TouchableOpacity onPress={handlePickPhoto} style={styles.avatarWrap} disabled={uploading}>
            {displayAvatar ? (
              <Image source={{ uri: displayAvatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitial} className='capitalize'>
                  {getDisplayName(currentUser)?.[0]?.toUpperCase()}
                </Text>
              </View>
            )}
            {uploading ? (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            ) : (
              <View style={styles.cameraOverlay}>
                <Plus size={14} color="#fff" />
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.profileInfo}>
            <Text style={styles.realName}>{displayNameText}</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNum}>{stats.followersCount}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNum}>{stats.followingCount}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNum}>{userPosts.length}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Username setup */}
        {/* <View style={styles.usernameRow}>
          <TextInput
            style={styles.usernameInput}
            placeholder="@username"
            placeholderTextColor="#CCC"
            value={userName}
            onChangeText={setUserName}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={30}
          />
          <TouchableOpacity
            style={[styles.saveBtn, (!userName.trim() || saving) && styles.saveBtnDisabled]}
            onPress={handleSaveUsername}
            disabled={!userName.trim() || saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Save</Text>
            )}
          </TouchableOpacity>
        </View> */}

        {/* Tabs */}
        <View style={styles.tabRow}>
          {[["posts", "Posts"], ["saved", "Saved"]].map(([key, label]) => (
            <TouchableOpacity
              key={key}
              style={[styles.tab, activeTab === key && styles.tabActive]}
              onPress={() => setActiveTab(key)}
            >
              <Text style={[styles.tabText, activeTab === key && styles.tabTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loadingData ? (
          <ActivityIndicator size="small" color={BRAND} style={{ marginTop: 20 }} />
        ) : listData.length === 0 ? (
          <Text style={styles.empty}>
            {activeTab === "posts" ? "No posts yet." : "No saved posts yet."}
          </Text>
        ) : (
          listData.map((p, i) => (
            <View key={i} style={styles.miniPost}>
              <Text style={styles.miniPostText} numberOfLines={2}>
                {p.content}
              </Text>
              <Text style={styles.miniPostMeta}>
                ❤️ {p.likesCount ?? 0}  💬 {p.commentsCount ?? 0}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "PlusJakartaSansBold",
    color: "#111",
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  profileHead: {
    flexDirection: "column",
    gap: 16,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  avatarWrap: { position: "relative" },
  avatar: { width: 70, height: 70, borderRadius: 35 },
  avatarFallback: {
    backgroundColor: BRAND,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    color: "#fff",
    fontSize: 30,
    fontFamily: "PlusJakartaSansBold",
  },
  cameraOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: BRAND,
    borderRadius: 99,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  uploadingOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 40,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  profileInfo: { flex: 1 },
  realName: {
    fontSize: 18,
    fontFamily: "PlusJakartaSansBold",
    color: "#111",
    marginBottom: 8,
    textAlign: 'center'
  },
  statsRow: { flexDirection: "row", gap: 40, marginTop: 20 },
  statItem: { alignItems: "center" },
  statNum: { fontSize: 20, fontFamily: "PlusJakartaSansBold", color: "#111" },
  statLabel: { fontSize: 12, fontFamily: "PlusJakartaSans", color: "#888" },
  usernameRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    marginBottom: 14,
    paddingHorizontal: 20,
  },
  usernameInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    fontFamily: "PlusJakartaSans",
    color: "#111",
  },
  saveBtn: {
    backgroundColor: BRAND,
    borderRadius: 99,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  saveBtnDisabled: { opacity: 0.45 },
  saveBtnText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "PlusJakartaSansBold",
  },
  tabRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center" },
  tabActive: { borderBottomWidth: 2, borderBottomColor: BRAND },
  tabText: { fontSize: 14, fontFamily: "PlusJakartaSans", color: "#888" },
  tabTextActive: { fontFamily: "PlusJakartaSansBold", color: BRAND },
  empty: {
    textAlign: "center",
    color: "#BBB",
    paddingVertical: 24,
    fontFamily: "PlusJakartaSans",
  },
  miniPost: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
    paddingHorizontal: 20,
  },
  miniPostText: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans",
    color: "#333",
    lineHeight: 20,
  },
  miniPostMeta: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans",
    color: "#BBB",
    marginTop: 4,
  },
});
