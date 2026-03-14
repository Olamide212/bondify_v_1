import * as ImagePicker from "expo-image-picker";
import { Plus } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../../constant/colors";
import feedService from "../../services/feedService";
import apiClient from "../../utils/axiosInstance";
import BaseModal from "../modals/BaseModal";

const BRAND = colors.primary;

const avatarUrl = (user) =>
  user?.profilePhoto || user?.images?.[0]?.url || user?.images?.[0] || null;

const displayName = (user) =>
  [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.userName || "User";

const FeedProfileSheet = ({ visible, user, onClose, onUpdate }) => {
  const [userName, setUserName] = useState(user?.userName ?? "");
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const [savedPosts, setSavedPosts] = useState([]);
  const [userPosts, setUserPosts] = useState([]);
  const [stats, setStats] = useState({ followersCount: 0, followingCount: 0 });
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (!visible || !user?._id) return;
    setUserName(user.userName ?? "");
    setLoadingData(true);
    Promise.all([
      feedService.getUserProfile(user._id).catch(() => null),
      feedService.getSavedPosts().catch(() => null),
    ])
      .then(([profileRes, savedRes]) => {
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
  }, [visible, user?._id]);

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

    try {
      // Upload the image via the upload endpoint
      const formData = new FormData();
      formData.append("photos", {
        uri,
        name: fileName,
        type: mimeType,
      });

      const uploadRes = await apiClient.post("/upload/photos", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const uploadedUrl =
        uploadRes.data?.data?.urls?.[0] ??
        uploadRes.data?.urls?.[0] ??
        uploadRes.data?.data?.[0]?.url ??
        uri;

      await feedService.updateSocialProfile({ profilePhoto: uploadedUrl });
      onUpdate?.({ profilePhoto: uploadedUrl });
    } catch {
      Alert.alert("Error", "Could not update photo.");
    }
  };

  const handleSaveUsername = async () => {
    if (!userName.trim()) return;
    setSaving(true);
    try {
      await feedService.updateSocialProfile({ userName: userName.trim() });
      onUpdate?.({ userName: userName.trim() });
    } catch (e) {
      Alert.alert("Error", e?.response?.data?.message ?? "Could not save username.");
    } finally {
      setSaving(false);
    }
  };

  const listData = activeTab === "posts" ? userPosts : savedPosts;

  return (
    <BaseModal visible={visible} onClose={onClose}>
      {/* Profile header */}
      <View style={styles.profileHead}>
        <TouchableOpacity onPress={handlePickPhoto} style={styles.avatarWrap}>
          {avatarUrl(user) ? (
            <Image source={{ uri: avatarUrl(user) }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitial}>
                {displayName(user)?.[0]?.toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.cameraOverlay}>
            <Plus size={14} color="#fff" />
          </View>
        </TouchableOpacity>

        <View style={styles.profileInfo}>
          <Text style={styles.realName}>{displayName(user)}</Text>
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
      <View style={styles.usernameRow}>
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
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {[
          ["posts", "Posts"],
          ["saved", "Saved"],
        ].map(([key, label]) => (
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
        <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
          {listData.map((p, i) => (
            <View key={i} style={styles.miniPost}>
              <Text style={styles.miniPostText} numberOfLines={2}>
                {p.content}
              </Text>
              <Text style={styles.miniPostMeta}>
                ❤️ {p.likesCount ?? 0}  💬 {p.commentsCount ?? 0}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}
    </BaseModal>
  );
};

export default FeedProfileSheet;

const styles = StyleSheet.create({
  profileHead: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  avatarWrap: { position: "relative" },
  avatar: { width: 72, height: 72, borderRadius: 36 },
  avatarFallback: {
    backgroundColor: BRAND,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    color: "#fff",
    fontSize: 28,
    fontFamily: "PlusJakartaSansBold",
  },
  cameraOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: BRAND,
    borderRadius: 99,
    width: 22,
    height: 22,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  profileInfo: { flex: 1 },
  realName: {
    fontSize: 17,
    fontFamily: "PlusJakartaSansBold",
    color: "#111",
    marginBottom: 8,
  },
  statsRow: { flexDirection: "row", gap: 20 },
  statItem: { alignItems: "center" },
  statNum: {
    fontSize: 16,
    fontFamily: "PlusJakartaSansBold",
    color: "#111",
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "PlusJakartaSans",
    color: "#888",
  },
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
  tabText: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans",
    color: "#888",
  },
  tabTextActive: {
    fontFamily: "PlusJakartaSansBold",
    color: BRAND,
  },
  empty: {
    textAlign: "center",
    color: "#BBB",
    paddingVertical: 24,
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
