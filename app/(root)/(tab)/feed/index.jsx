/**
 * Social Feed Screen  —  app/(root)/(tab)/feed/index.jsx
 *
 * Features:
 *  • Header with app brand + profile avatar (opens SocialProfile sheet)
 *  • Tab bar: "For You" | "New" | "Following"
 *  • Infinite-scrolling post list
 *  • Like / Comment / Save on each post with engagement analytics
 *  • Create-post FAB → CreatePostSheet with AI suggestions
 *  • SocialProfile bottom-sheet (own profile: username, photo, saved posts, follow counts)
 */

import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import {
  Bookmark,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Send,
  Sparkles,
  UserCheck,
  UserPlus,
  X,
} from "lucide-react-native";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { colors } from "../../../../constant/colors";
import feedService from "../../../../services/feedService";

const { width: SW } = Dimensions.get("window");
const BRAND = colors.primary;
const TABS  = ["For You", "New", "Following"];
const TAB_KEYS = ["foryou", "new", "following"];

// ─── helpers ──────────────────────────────────────────────────────────────────
const timeAgo = (dateStr) => {
  if (!dateStr) return "";
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)   return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
};

const avatar = (user) =>
  user?.profilePhoto || user?.images?.[0]?.url || user?.images?.[0] || null;

const displayName = (user) =>
  [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.userName || "User";

// ─── Post Card ────────────────────────────────────────────────────────────────
const PostCard = ({ post, currentUserId, onLike, onSave, onComment, onFollow, onDelete }) => {
  const [likeAnim] = useState(new Animated.Value(1));
  const authorId = post.author?._id ?? post.author;
  const isOwn    = String(authorId) === String(currentUserId);

  const handleLike = () => {
    Animated.sequence([
      Animated.timing(likeAnim, { toValue: 1.4, duration: 100, useNativeDriver: true }),
      Animated.timing(likeAnim, { toValue: 1,   duration: 100, useNativeDriver: true }),
    ]).start();
    onLike(post._id);
  };

  return (
    <View style={pStyles.card}>
      {/* Author row */}
      <View style={pStyles.authorRow}>
        {avatar(post.author) ? (
          <Image source={{ uri: avatar(post.author) }} style={pStyles.authorAvatar} />
        ) : (
          <View style={[pStyles.authorAvatar, pStyles.avatarFallback]}>
            <Text style={pStyles.avatarInitial}>{displayName(post.author)?.[0]?.toUpperCase()}</Text>
          </View>
        )}
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={pStyles.authorName}>{displayName(post.author)}</Text>
          {post.author?.userName && (
            <Text style={pStyles.authorHandle}>@{post.author.userName}</Text>
          )}
        </View>
        <Text style={pStyles.timeAgo}>{timeAgo(post.createdAt)}</Text>

        {!isOwn && (
          <TouchableOpacity
            style={[pStyles.followBtn, post._isFollowing && pStyles.followBtnActive]}
            onPress={() => onFollow(authorId, post._id)}
            hitSlop={8}
          >
            {post._isFollowing
              ? <UserCheck size={14} color={BRAND} />
              : <UserPlus  size={14} color="#fff"  />}
          </TouchableOpacity>
        )}

        {isOwn && (
          <TouchableOpacity onPress={() => onDelete(post._id)} hitSlop={8}>
            <X size={18} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <Text style={pStyles.content}>{post.content}</Text>

      {/* Media */}
      {post.mediaUrls?.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
          {post.mediaUrls.map((url, i) => (
            <Image key={i} source={{ uri: url }} style={pStyles.mediaImg} />
          ))}
        </ScrollView>
      )}

      {/* Analytics bar */}
      <View style={pStyles.analyticsRow}>
        <Text style={pStyles.analyticsText}>{post.likesCount ?? 0} likes</Text>
        <Text style={pStyles.analyticsText}>{post.commentsCount ?? 0} comments</Text>
        <Text style={pStyles.analyticsText}>{post.views ?? 0} views</Text>
      </View>

      {/* Action row */}
      <View style={pStyles.actionRow}>
        <TouchableOpacity style={pStyles.actionBtn} onPress={handleLike}>
          <Animated.View style={{ transform: [{ scale: likeAnim }] }}>
            <Heart
              size={20}
              color={post.isLiked ? "#FB3857" : "#888"}
              fill={post.isLiked ? "#FB3857" : "transparent"}
            />
          </Animated.View>
          <Text style={[pStyles.actionLabel, post.isLiked && { color: "#FB3857" }]}>
            {post.likesCount ?? 0}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={pStyles.actionBtn} onPress={() => onComment(post)}>
          <MessageCircle size={20} color="#888" />
          <Text style={pStyles.actionLabel}>{post.commentsCount ?? 0}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={pStyles.actionBtn} onPress={() => onSave(post._id)}>
          <Bookmark
            size={20}
            color={post.isSaved ? BRAND : "#888"}
            fill={post.isSaved ? BRAND : "transparent"}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const pStyles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginBottom: 10,
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  authorRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  authorAvatar: { width: 40, height: 40, borderRadius: 20 },
  avatarFallback: { backgroundColor: BRAND, justifyContent: "center", alignItems: "center" },
  avatarInitial: { color: "#fff", fontSize: 16, fontFamily: "PlusJakartaSansBold" },
  authorName:   { fontSize: 14, fontFamily: "PlusJakartaSansBold", color: "#111" },
  authorHandle: { fontSize: 12, fontFamily: "PlusJakartaSans",     color: "#999" },
  timeAgo:      { fontSize: 12, fontFamily: "PlusJakartaSans",     color: "#BBB", marginRight: 8 },
  followBtn: {
    backgroundColor: BRAND,
    borderRadius: 99,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginLeft: 8,
  },
  followBtnActive: { backgroundColor: "#FFF0EA", borderWidth: 1, borderColor: BRAND },
  content: { fontSize: 15, fontFamily: "PlusJakartaSans", color: "#222", lineHeight: 22 },
  mediaImg: {
    width: SW * 0.65,
    height: SW * 0.65,
    borderRadius: 12,
    marginRight: 8,
    marginTop: 4,
  },
  analyticsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  analyticsText: { fontSize: 12, fontFamily: "PlusJakartaSans", color: "#BBB" },
  actionRow: {
    flexDirection: "row",
    gap: 20,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  actionBtn:   { flexDirection: "row", alignItems: "center", gap: 5 },
  actionLabel: { fontSize: 13, fontFamily: "PlusJakartaSans", color: "#888" },
});

// ─── Comment Sheet ─────────────────────────────────────────────────────────────
const CommentSheet = ({ visible, post, currentUserId, onClose, onSubmit }) => {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    await onSubmit(post?._id, text.trim());
    setText("");
    setLoading(false);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={cStyles.backdrop} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "position" : "height"} style={cStyles.wrapper}>
        <View style={cStyles.sheet}>
          <View style={cStyles.handle} />
          <Text style={cStyles.title}>Comments</Text>

          <ScrollView style={{ maxHeight: 300 }} keyboardShouldPersistTaps="handled">
            {(post?.comments ?? []).slice(0, 30).map((c, i) => (
              <View key={i} style={cStyles.commentRow}>
                <Text style={cStyles.commentAuthor}>
                  {displayName(c.author) ?? "User"}
                </Text>
                <Text style={cStyles.commentText}>{c.content}</Text>
              </View>
            ))}
            {(post?.comments?.length ?? 0) === 0 && (
              <Text style={cStyles.empty}>No comments yet. Be the first!</Text>
            )}
          </ScrollView>

          <View style={cStyles.inputRow}>
            <TextInput
              style={cStyles.input}
              placeholder="Add a comment…"
              placeholderTextColor="#BBB"
              value={text}
              onChangeText={setText}
              multiline
              maxLength={300}
            />
            <TouchableOpacity
              style={[cStyles.sendBtn, !text.trim() && cStyles.sendBtnDisabled]}
              onPress={handleSubmit}
              disabled={!text.trim() || loading}
            >
              {loading
                ? <ActivityIndicator size="small" color="#fff" />
                : <Send size={18} color="#fff" />}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const cStyles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)" },
  wrapper:  { position: "absolute", bottom: 0, left: 0, right: 0, justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 22, borderTopRightRadius: 22,
    padding: 20, paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  handle:  { alignSelf: "center", width: 36, height: 4, borderRadius: 2, backgroundColor: "#E0E0E0", marginBottom: 14 },
  title:   { fontSize: 16, fontFamily: "PlusJakartaSansBold", color: "#111", marginBottom: 12 },
  commentRow: { marginBottom: 10 },
  commentAuthor: { fontSize: 13, fontFamily: "PlusJakartaSansBold", color: "#111" },
  commentText:   { fontSize: 14, fontFamily: "PlusJakartaSans",     color: "#444", marginTop: 2 },
  empty: { color: "#BBB", textAlign: "center", paddingVertical: 20 },
  inputRow: { flexDirection: "row", gap: 10, alignItems: "flex-end", marginTop: 10 },
  input: {
    flex: 1, borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12,
    padding: 10, fontSize: 14, fontFamily: "PlusJakartaSans", color: "#111",
    minHeight: 42, maxHeight: 100, textAlignVertical: "top",
  },
  sendBtn: {
    backgroundColor: BRAND, borderRadius: 99, width: 40, height: 40,
    justifyContent: "center", alignItems: "center",
  },
  sendBtnDisabled: { opacity: 0.45 },
});

// ─── Create Post Sheet ─────────────────────────────────────────────────────────
const CreatePostSheet = ({ visible, onClose, onCreated }) => {
  const [text,       setText]       = useState("");
  const [loading,    setLoading]    = useState(false);
  const [aiLoading,  setAiLoading]  = useState(false);
  const [aiContext,  setAiContext]   = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [error,      setError]       = useState(null);

  const handleCreate = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await feedService.createPost({ content: text.trim() });
      onCreated(res.data);
      setText(""); setSuggestions([]); setAiContext("");
      onClose();
    } catch {
      setError("Failed to post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAI = async () => {
    setAiLoading(true);
    setError(null);
    try {
      const res = await feedService.suggestPost(aiContext);
      setSuggestions(res.data?.suggestions ?? []);
    } catch {
      setError("AI suggestion failed. Try again.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={createStyles.backdrop} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "position" : "height"} style={createStyles.wrapper}>
        <View style={createStyles.sheet}>
          <View style={createStyles.handle} />
          <View style={createStyles.header}>
            <Text style={createStyles.title}>Create Post</Text>
            <TouchableOpacity onPress={onClose}><X size={22} color="#999" /></TouchableOpacity>
          </View>

          <TextInput
            style={createStyles.input}
            placeholder="What's on your mind?"
            placeholderTextColor="#BBB"
            value={text}
            onChangeText={setText}
            multiline
            maxLength={2000}
            autoFocus
          />

          {/* AI context input */}
          <View style={createStyles.aiRow}>
            <TextInput
              style={createStyles.aiInput}
              placeholder="AI topic hint (optional)…"
              placeholderTextColor="#CCC"
              value={aiContext}
              onChangeText={setAiContext}
              returnKeyType="done"
            />
            <TouchableOpacity style={createStyles.aiBtn} onPress={handleAI} disabled={aiLoading}>
              {aiLoading
                ? <ActivityIndicator size="small" color={BRAND} />
                : <><Sparkles size={15} color={BRAND} /><Text style={createStyles.aiBtnText}> AI</Text></>}
            </TouchableOpacity>
          </View>

          {/* AI suggestions */}
          {suggestions.length > 0 && (
            <View style={createStyles.suggestions}>
              {suggestions.map((s, i) => (
                <TouchableOpacity key={i} style={createStyles.chip} onPress={() => setText(s)}>
                  <Text style={createStyles.chipText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {!!error && <Text style={createStyles.error}>{error}</Text>}

          <View style={createStyles.footer}>
            <Text style={createStyles.charCount}>{text.length}/2000</Text>
            <TouchableOpacity
              style={[createStyles.postBtn, (!text.trim() || loading) && createStyles.postBtnDisabled]}
              onPress={handleCreate}
              disabled={!text.trim() || loading}
            >
              {loading
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={createStyles.postBtnText}>Post</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const createStyles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
  wrapper:  { position: "absolute", bottom: 0, left: 0, right: 0, justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: Platform.OS === "ios" ? 42 : 28,
  },
  handle:   { alignSelf: "center", width: 36, height: 4, borderRadius: 2, backgroundColor: "#E0E0E0", marginBottom: 14 },
  header:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  title:    { fontSize: 17, fontFamily: "PlusJakartaSansBold", color: "#111" },
  input: {
    minHeight: 110, borderWidth: 1.5, borderColor: "#F0F0F0", borderRadius: 14,
    padding: 14, fontSize: 15, fontFamily: "PlusJakartaSans", color: "#111",
    backgroundColor: "#FAFAFA", textAlignVertical: "top", marginBottom: 10,
  },
  aiRow: { flexDirection: "row", gap: 8, alignItems: "center", marginBottom: 8 },
  aiInput: {
    flex: 1, borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10,
    padding: 9, fontSize: 13, fontFamily: "PlusJakartaSans", color: "#333",
  },
  aiBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingVertical: 9, paddingHorizontal: 14, borderRadius: 10,
    borderWidth: 1.5, borderColor: BRAND, backgroundColor: "#FFF8F5",
  },
  aiBtnText: { fontSize: 13, fontFamily: "PlusJakartaSansBold", color: BRAND },
  suggestions: { gap: 6, marginBottom: 10 },
  chip: {
    borderRadius: 12, borderWidth: 1, borderColor: "#F5C4AC",
    backgroundColor: "#FFF0EA", padding: 10,
  },
  chipText: { fontSize: 14, fontFamily: "PlusJakartaSans", color: "#333" },
  error: { color: "red", fontSize: 13, marginBottom: 8 },
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  charCount: { fontSize: 12, color: "#CCC", fontFamily: "PlusJakartaSans" },
  postBtn: {
    backgroundColor: BRAND, borderRadius: 99, paddingVertical: 11, paddingHorizontal: 28,
  },
  postBtnDisabled: { opacity: 0.45 },
  postBtnText: { color: "#fff", fontSize: 15, fontFamily: "PlusJakartaSansBold" },
});

// ─── Social Profile Sheet ──────────────────────────────────────────────────────
const SocialProfileSheet = ({ visible, user, onClose, onUpdate }) => {
  const [userName,     setUserName]   = useState(user?.userName ?? "");
  const [saving,       setSaving]     = useState(false);
  const [activeTab,    setActiveTab]  = useState("posts");  // posts | saved
  const [savedPosts,   setSavedPosts] = useState([]);
  const [userPosts,    setUserPosts]  = useState([]);
  const [stats,        setStats]      = useState({ followersCount: 0, followingCount: 0 });
  const [loadingData,  setLoadingData] = useState(false);

  useEffect(() => {
    if (!visible || !user?._id) return;
    setUserName(user.userName ?? "");
    setLoadingData(true);
    Promise.all([
      feedService.getUserProfile(user._id).catch(() => null),
      feedService.getSavedPosts().catch(() => null),
    ]).then(([profileRes, savedRes]) => {
      if (profileRes?.data) {
        setUserPosts(profileRes.data.posts ?? []);
        setStats({ followersCount: profileRes.data.followersCount ?? 0, followingCount: profileRes.data.followingCount ?? 0 });
      }
      if (savedRes?.data) setSavedPosts(savedRes.data);
    }).finally(() => setLoadingData(false));
  }, [visible, user?._id]);

  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled) return;
    const uri = result.assets[0].uri;
    // FIXME: Upload the image to S3 (via /api/upload/photos) before saving.
    // Currently saves the local device URI which is not accessible to other users.
    try {
      await feedService.updateSocialProfile({ profilePhoto: uri });
      onUpdate?.({ profilePhoto: uri });
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
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={spStyles.backdrop} onPress={onClose} />
      <View style={spStyles.sheet}>
        <View style={spStyles.handle} />

        {/* Profile header */}
        <View style={spStyles.profileHead}>
          <TouchableOpacity onPress={handlePickPhoto} style={spStyles.avatarWrap}>
            {avatar(user) ? (
              <Image source={{ uri: avatar(user) }} style={spStyles.avatar} />
            ) : (
              <View style={[spStyles.avatar, spStyles.avatarFallback]}>
                <Text style={spStyles.avatarInitial}>{displayName(user)?.[0]?.toUpperCase()}</Text>
              </View>
            )}
            <View style={spStyles.cameraOverlay}><Plus size={14} color="#fff" /></View>
          </TouchableOpacity>

          <View style={spStyles.profileInfo}>
            <Text style={spStyles.realName}>{displayName(user)}</Text>
            <View style={spStyles.statsRow}>
              <View style={spStyles.statItem}>
                <Text style={spStyles.statNum}>{stats.followersCount}</Text>
                <Text style={spStyles.statLabel}>Followers</Text>
              </View>
              <View style={spStyles.statItem}>
                <Text style={spStyles.statNum}>{stats.followingCount}</Text>
                <Text style={spStyles.statLabel}>Following</Text>
              </View>
              <View style={spStyles.statItem}>
                <Text style={spStyles.statNum}>{userPosts.length}</Text>
                <Text style={spStyles.statLabel}>Posts</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Username setup */}
        <View style={spStyles.usernameRow}>
          <TextInput
            style={spStyles.usernameInput}
            placeholder="@username"
            placeholderTextColor="#CCC"
            value={userName}
            onChangeText={setUserName}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={30}
          />
          <TouchableOpacity
            style={[spStyles.saveBtn, (!userName.trim() || saving) && spStyles.saveBtnDisabled]}
            onPress={handleSaveUsername}
            disabled={!userName.trim() || saving}
          >
            {saving
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={spStyles.saveBtnText}>Save</Text>}
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={spStyles.tabRow}>
          {[["posts", "Posts"], ["saved", "Saved"]].map(([key, label]) => (
            <TouchableOpacity
              key={key}
              style={[spStyles.tab, activeTab === key && spStyles.tabActive]}
              onPress={() => setActiveTab(key)}
            >
              <Text style={[spStyles.tabText, activeTab === key && spStyles.tabTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loadingData ? (
          <ActivityIndicator size="small" color={BRAND} style={{ marginTop: 20 }} />
        ) : listData.length === 0 ? (
          <Text style={spStyles.empty}>
            {activeTab === "posts" ? "No posts yet." : "No saved posts yet."}
          </Text>
        ) : (
          <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
            {listData.map((p, i) => (
              <View key={i} style={spStyles.miniPost}>
                <Text style={spStyles.miniPostText} numberOfLines={2}>{p.content}</Text>
                <Text style={spStyles.miniPostMeta}>
                  ❤️ {p.likesCount ?? 0}  💬 {p.commentsCount ?? 0}
                </Text>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
};

const spStyles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 20, paddingBottom: Platform.OS === "ios" ? 44 : 28,
    maxHeight: "85%",
  },
  handle:      { alignSelf: "center", width: 36, height: 4, borderRadius: 2, backgroundColor: "#E0E0E0", marginBottom: 18 },
  profileHead: { flexDirection: "row", gap: 16, alignItems: "center", marginBottom: 16 },
  avatarWrap:  { position: "relative" },
  avatar:      { width: 72, height: 72, borderRadius: 36 },
  avatarFallback: { backgroundColor: BRAND, justifyContent: "center", alignItems: "center" },
  avatarInitial:  { color: "#fff", fontSize: 28, fontFamily: "PlusJakartaSansBold" },
  cameraOverlay: {
    position: "absolute", bottom: 0, right: 0,
    backgroundColor: BRAND, borderRadius: 99, width: 22, height: 22,
    justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "#fff",
  },
  profileInfo:  { flex: 1 },
  realName:     { fontSize: 17, fontFamily: "PlusJakartaSansBold", color: "#111", marginBottom: 8 },
  statsRow:     { flexDirection: "row", gap: 20 },
  statItem:     { alignItems: "center" },
  statNum:      { fontSize: 16, fontFamily: "PlusJakartaSansBold", color: "#111" },
  statLabel:    { fontSize: 11, fontFamily: "PlusJakartaSans",     color: "#888" },
  usernameRow:  { flexDirection: "row", gap: 10, alignItems: "center", marginBottom: 14 },
  usernameInput: {
    flex: 1, borderWidth: 1.5, borderColor: "#E5E7EB", borderRadius: 10,
    padding: 10, fontSize: 14, fontFamily: "PlusJakartaSans", color: "#111",
  },
  saveBtn: { backgroundColor: BRAND, borderRadius: 99, paddingVertical: 10, paddingHorizontal: 18 },
  saveBtnDisabled: { opacity: 0.45 },
  saveBtnText: { color: "#fff", fontSize: 14, fontFamily: "PlusJakartaSansBold" },
  tabRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#F0F0F0", marginBottom: 12 },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center" },
  tabActive: { borderBottomWidth: 2, borderBottomColor: BRAND },
  tabText: { fontSize: 14, fontFamily: "PlusJakartaSans", color: "#888" },
  tabTextActive: { fontFamily: "PlusJakartaSansBold", color: BRAND },
  empty: { textAlign: "center", color: "#BBB", paddingVertical: 24 },
  miniPost: {
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F5F5F5",
  },
  miniPostText: { fontSize: 14, fontFamily: "PlusJakartaSans", color: "#333", lineHeight: 20 },
  miniPostMeta: { fontSize: 12, fontFamily: "PlusJakartaSans", color: "#BBB", marginTop: 4 },
});

// ─── Main Feed Screen ──────────────────────────────────────────────────────────
export default function FeedScreen() {
  const { user: currentUser } = useSelector((s) => s.auth);

  const [activeTab,    setActiveTab]    = useState(0);
  const [posts,        setPosts]        = useState([]);
  const [page,         setPage]         = useState(1);
  const [hasMore,      setHasMore]      = useState(true);
  const [loading,      setLoading]      = useState(false);
  const [refreshing,   setRefreshing]   = useState(false);
  const [showCreate,   setShowCreate]   = useState(false);
  const [commentPost,  setCommentPost]  = useState(null);
  const [showProfile,  setShowProfile]  = useState(false);

  // ── Follow cache (postId -> isFollowing) shared across cards ─────────────
  const followCache  = useRef({});
  // Request ID to prevent stale responses from overwriting newer ones
  const requestIdRef = useRef(0);

  const loadPosts = useCallback(async (tabIndex = activeTab, pg = 1, append = false) => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const res = await feedService.getFeed({ tab: TAB_KEYS[tabIndex], page: pg, limit: 20 });
      // Discard stale response if a newer request has started
      if (requestId !== requestIdRef.current) return;
      const newPosts = (res.data ?? []).map((p) => ({
        ...p,
        _isFollowing: followCache.current[p.author?._id] ?? false,
      }));
      setPosts((prev) => append ? [...prev, ...newPosts] : newPosts);
      setHasMore(res.pagination?.hasMore ?? false);
      setPage(pg);
    } catch {
      // silent fail — network errors are expected on mobile
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadPosts(activeTab, 1, false);
  }, [activeTab]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPosts(activeTab, 1, false);
    setRefreshing(false);
  };

  const onEndReached = () => {
    if (!loading && hasMore) loadPosts(activeTab, page + 1, true);
  };

  // ── Like ────────────────────────────────────────────────────────────────────
  const handleLike = async (postId) => {
    // Optimistic update
    const prev = posts.find((p) => p._id === postId);
    setPosts((all) =>
      all.map((p) =>
        p._id === postId
          ? {
              ...p,
              isLiked:    !p.isLiked,
              likesCount: p.isLiked ? (p.likesCount ?? 1) - 1 : (p.likesCount ?? 0) + 1,
            }
          : p
      )
    );
    try {
      await feedService.toggleLike(postId);
    } catch {
      // Revert on failure
      if (prev) {
        setPosts((all) => all.map((p) => (p._id === postId ? prev : p)));
      }
    }
  };

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async (postId) => {
    const prev = posts.find((p) => p._id === postId);
    setPosts((all) =>
      all.map((p) =>
        p._id === postId
          ? { ...p, isSaved: !p.isSaved, savesCount: p.isSaved ? (p.savesCount ?? 1) - 1 : (p.savesCount ?? 0) + 1 }
          : p
      )
    );
    try {
      await feedService.toggleSave(postId);
    } catch {
      if (prev) setPosts((all) => all.map((p) => (p._id === postId ? prev : p)));
    }
  };

  // ── Follow ──────────────────────────────────────────────────────────────────
  const handleFollow = async (authorId) => {
    // Optimistic update
    const prevFollowing = followCache.current[authorId] ?? false;
    const nextFollowing = !prevFollowing;
    followCache.current[authorId] = nextFollowing;
    setPosts((all) =>
      all.map((p) =>
        String(p.author?._id) === String(authorId)
          ? { ...p, _isFollowing: nextFollowing }
          : p
      )
    );
    try {
      const res = await feedService.toggleFollow(authorId);
      // Sync with server truth
      const confirmed = res.data?.following ?? nextFollowing;
      followCache.current[authorId] = confirmed;
      setPosts((all) =>
        all.map((p) =>
          String(p.author?._id) === String(authorId)
            ? { ...p, _isFollowing: confirmed }
            : p
        )
      );
    } catch {
      // Revert
      followCache.current[authorId] = prevFollowing;
      setPosts((all) =>
        all.map((p) =>
          String(p.author?._id) === String(authorId)
            ? { ...p, _isFollowing: prevFollowing }
            : p
        )
      );
    }
  };

  // ── Comment ─────────────────────────────────────────────────────────────────
  const handleComment = (post) => setCommentPost(post);

  const handleSubmitComment = async (postId, content) => {
    try {
      const res = await feedService.addComment(postId, content);
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId
            ? {
                ...p,
                comments:      [...(p.comments ?? []), res.data],
                commentsCount: (p.commentsCount ?? 0) + 1,
              }
            : p
        )
      );
      // Also update commentPost if open
      setCommentPost((prev) =>
        prev?._id === postId
          ? { ...prev, comments: [...(prev.comments ?? []), res.data] }
          : prev
      );
    } catch {}
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = (postId) => {
    Alert.alert("Delete Post", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setPosts((prev) => prev.filter((p) => p._id !== postId));
          try { await feedService.deletePost(postId); } catch {}
        },
      },
    ]);
  };

  // ── Post created ────────────────────────────────────────────────────────────
  const handlePostCreated = (newPost) => {
    setPosts((prev) => [{ ...newPost, isLiked: false, isSaved: false, _isFollowing: false }, ...prev]);
  };

  // ── Tab indicator anim ──────────────────────────────────────────────────────
  const indicatorX = useRef(new Animated.Value(0)).current;
  const tabW = (SW - 24) / TABS.length;
  const handleTabPress = (i) => {
    Animated.spring(indicatorX, { toValue: i * tabW, useNativeDriver: true, bounciness: 4 }).start();
    setActiveTab(i);
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  const userAvatar = avatar(currentUser);

  return (
    <SafeAreaView style={fStyles.container} edges={["top"]}>
      {/* Header */}
      <View style={fStyles.header}>
        <Text style={fStyles.brand}>bondify</Text>
        <TouchableOpacity onPress={() => setShowProfile(true)}>
          {userAvatar ? (
            <Image source={{ uri: userAvatar }} style={fStyles.headerAvatar} />
          ) : (
            <View style={[fStyles.headerAvatar, fStyles.headerAvatarFallback]}>
              <Text style={fStyles.headerAvatarInitial}>
                {displayName(currentUser)?.[0]?.toUpperCase() ?? "?"}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Tab bar */}
      <View style={fStyles.tabBar}>
        <Animated.View
          style={[fStyles.tabIndicator, { width: tabW - 16, transform: [{ translateX: indicatorX }] }]}
        />
        {TABS.map((t, i) => (
          <TouchableOpacity
            key={t}
            style={[fStyles.tabItem, { width: tabW }]}
            onPress={() => handleTabPress(i)}
          >
            <Text style={[fStyles.tabLabel, activeTab === i && fStyles.tabLabelActive]}>
              {t}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Post list */}
      <FlatList
        data={posts}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            currentUserId={currentUser?._id}
            onLike={handleLike}
            onSave={handleSave}
            onComment={handleComment}
            onFollow={handleFollow}
            onDelete={handleDelete}
          />
        )}
        contentContainerStyle={{ paddingTop: 10, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[BRAND]}
            tintColor={BRAND}
          />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          loading && posts.length > 0 ? (
            <ActivityIndicator size="small" color={BRAND} style={{ marginVertical: 16 }} />
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <View style={fStyles.emptyState}>
              <Text style={fStyles.emptyEmoji}>✨</Text>
              <Text style={fStyles.emptyTitle}>Nothing here yet</Text>
              <Text style={fStyles.emptySub}>
                {activeTab === 2
                  ? "Follow people to see their posts here."
                  : "Be the first to post something!"}
              </Text>
            </View>
          ) : (
            <ActivityIndicator size="large" color={BRAND} style={{ marginTop: 60 }} />
          )
        }
      />

      {/* Create FAB */}
      <TouchableOpacity style={fStyles.fab} onPress={() => setShowCreate(true)}>
        <Plus size={26} color="#fff" />
      </TouchableOpacity>

      {/* Sheets & modals */}
      <CreatePostSheet
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handlePostCreated}
      />

      <CommentSheet
        visible={!!commentPost}
        post={commentPost}
        currentUserId={currentUser?._id}
        onClose={() => setCommentPost(null)}
        onSubmit={handleSubmitComment}
      />

      <SocialProfileSheet
        visible={showProfile}
        user={currentUser}
        onClose={() => setShowProfile(false)}
        onUpdate={() => {}}
      />
    </SafeAreaView>
  );
}

const fStyles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: "#F7F7FB" },
  header: {
    flexDirection:  "row",
    justifyContent: "space-between",
    alignItems:     "center",
    paddingHorizontal: 16,
    paddingVertical:   12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  brand: { fontSize: 22, fontFamily: "PlusJakartaSansBold", color: BRAND, letterSpacing: 0.5 },
  headerAvatar: { width: 38, height: 38, borderRadius: 19 },
  headerAvatarFallback: { backgroundColor: BRAND, justifyContent: "center", alignItems: "center" },
  headerAvatarInitial:  { color: "#fff", fontSize: 16, fontFamily: "PlusJakartaSansBold" },

  tabBar: {
    flexDirection:   "row",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingTop:      8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    position:        "relative",
  },
  tabItem:       { paddingVertical: 10, alignItems: "center" },
  tabLabel:      { fontSize: 14, fontFamily: "PlusJakartaSans", color: "#AAA" },
  tabLabelActive: { fontFamily: "PlusJakartaSansBold", color: BRAND },
  tabIndicator: {
    position:        "absolute",
    bottom:          0,
    left:            20,
    height:          2.5,
    borderRadius:    2,
    backgroundColor: BRAND,
  },

  emptyState:  { alignItems: "center", paddingTop: 80, paddingHorizontal: 40 },
  emptyEmoji:  { fontSize: 44, marginBottom: 12 },
  emptyTitle:  { fontSize: 18, fontFamily: "PlusJakartaSansBold", color: "#111", marginBottom: 6 },
  emptySub:    { fontSize: 14, fontFamily: "PlusJakartaSans", color: "#888", textAlign: "center", lineHeight: 20 },

  fab: {
    position:        "absolute",
    bottom:          100,
    right:           20,
    width:           56,
    height:          56,
    borderRadius:    28,
    backgroundColor: BRAND,
    justifyContent:  "center",
    alignItems:      "center",
    shadowColor:     BRAND,
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.4,
    shadowRadius:    8,
    elevation:       8,
  },
});
