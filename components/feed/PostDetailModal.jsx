import { Image } from "expo-image";
import {
    Bookmark,
    ChevronLeft,
    CornerDownRight,
    Heart,
    MessageCircle,
    MoreHorizontal,
    Send,
    Share2,
    UserMinus,
    UserPlus,
} from "lucide-react-native";
import { useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../constant/colors";
import { useAlert } from "../../context/AlertContext";
import BaseModal from "../modals/BaseModal";
import PostOptionsModal from "./PostOptionsModal";

const BRAND = colors.primary;
const { width: SW } = Dimensions.get("window");

const timeAgo = (dateStr) => {
  if (!dateStr) return "";
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
};

const avatarUrl = (user) =>
  user?.profilePhoto || user?.images?.[0]?.url || user?.images?.[0] || null;

const displayName = (user) =>
  [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.userName || "User";

const PostDetailModal = ({
  visible,
  post,
  currentUserId,
  onClose,
  onLike,
  onSave,
  onSubmitComment,
  onOpenOptions,
  onFollow,
  onCommentLike,
  onShare,
  isFollowing = false,
}) => {
  const { showAlert } = useAlert();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [likeAnim] = useState(new Animated.Value(1));
  const [replyTo, setReplyTo] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const insets = useSafeAreaInsets();

  if (!post) return null;

  const isOwnPost = String(post.author?._id) === String(currentUserId);

  const handleLike = () => {
    Animated.sequence([
      Animated.timing(likeAnim, { toValue: 1.4, duration: 100, useNativeDriver: true }),
      Animated.timing(likeAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    onLike(post._id);
  };

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    await onSubmitComment(post._id, text.trim(), replyTo?._id ?? null);
    setText("");
    setReplyTo(null);
    setLoading(false);
  };

  const handleShare = async () => {
    try {
      const content = post.content?.substring(0, 100) + (post.content?.length > 100 ? "…" : "");
      const result = await Share.share({
        message: `Check out this post by ${displayName(post.author)} on BonFeed:\n\n"${content}"`,
        title: "Share Post",
      });
      if (result.action === Share.sharedAction) {
        onShare?.(post._id);
      }
    } catch {
      // user cancelled or error
    }
  };

  const handleOptionSelect = (key) => {
    const authorId = post.author?._id ?? post.author;
    switch (key) {
      case "share":
        handleShare();
        break;
      case "save":
        onSave(post._id);
        break;
      case "follow":
        onFollow?.(authorId);
        break;
      case "mute":
        showAlert({
          icon: 'success',
          title: 'Muted',
          message: 'You won\'t see posts from this user.',
        });
        break;
      case "report":
        showAlert({
          icon: 'success',
          title: 'Report',
          message: 'This post has been reported.',
        });
        break;
      case "block":
        showAlert({
          icon: 'success',
          title: 'Block',
          message: 'This user has been blocked.',
        });
        break;
      case "delete":
        onOpenOptions?.({ ...post, _deleteFromDetail: true });
        break;
    }
  };

  const comments = post.comments ?? [];

  // ── Build a flat list: each top-level comment is followed by its replies ──────
  const topLevel = comments.filter((c) => !c.parentId);
  const repliesMap = {};
  comments
    .filter((c) => c.parentId)
    .forEach((r) => {
      const key = String(r.parentId);
      if (!repliesMap[key]) repliesMap[key] = [];
      repliesMap[key].push(r);
    });

  const flatComments = [];
  topLevel.forEach((c) => {
    flatComments.push({ _type: "comment", ...c });
    (repliesMap[String(c._id)] ?? []).forEach((r) =>
      flatComments.push({ _type: "reply", ...r })
    );
  });

  const renderComment = ({ item }) => {
    const isReply = item._type === "reply";
    return (
      <View style={[styles.commentRow, isReply && styles.replyRow]}>
        {isReply && (
          <View style={styles.replyIconCol}>
            <CornerDownRight size={14} color="#D1D5DB" />
          </View>
        )}
        {avatarUrl(item.author) ? (
          <Image
            source={{ uri: avatarUrl(item.author) }}
            style={[styles.commentAvatar, isReply && styles.replyAvatar]}
            cachePolicy="memory-disk"
            transition={150}
          />
        ) : (
          <View
            style={[
              styles.commentAvatar,
              styles.commentAvatarFallback,
              isReply && styles.replyAvatar,
            ]}
          >
            <Text style={styles.commentAvatarInitial}>
              {displayName(item.author)?.[0]?.toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.commentBody}>
          <Text style={styles.commentAuthor}>{displayName(item.author)}</Text>
          <Text style={styles.commentText}>{item.content}</Text>
          <View style={styles.commentActions}>
            <Text style={styles.commentTime}>{timeAgo(item.createdAt)}</Text>
            <TouchableOpacity
              style={styles.commentActionBtn}
              onPress={() => onCommentLike?.(post._id, item._id)}
            >
              <Heart
                size={14}
                color={item.isLiked ? "#FB3857" : "#BBB"}
                fill={item.isLiked ? "#FB3857" : "transparent"}
              />
              {(item.likes?.length ?? 0) > 0 && (
                <Text style={[styles.commentActionText, item.isLiked && { color: "#FB3857" }]}>
                  {item.likes.length}
                </Text>
              )}
            </TouchableOpacity>
            {/* Only top-level comments can be replied to */}
            {!isReply && (
              <TouchableOpacity
                style={styles.commentActionBtn}
                onPress={() => setReplyTo(item)}
              >
                <MessageCircle size={14} color="#BBB" />
                <Text style={styles.commentActionText}>Reply</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  const PostHeader = () => (
    <View style={styles.postContainer}>
      {/* Author row */}
      <View style={styles.authorRow}>
        {avatarUrl(post.author) ? (
          <Image source={{ uri: avatarUrl(post.author) }} style={styles.authorAvatar} cachePolicy="memory-disk" transition={150} />
        ) : (
          <View style={[styles.authorAvatar, styles.avatarFallback]}>
            <Text style={styles.avatarInitial}>
              {displayName(post.author)?.[0]?.toUpperCase()}
            </Text>
          </View>
        )}
        <View style={{ flex: 1, marginLeft: 10 }}>
          <View style={styles.nameFollowRow}>
            <Text style={styles.authorName}>{displayName(post.author)}</Text>
            {!isOwnPost && (
              <TouchableOpacity
                style={[
                  styles.followBtn,
                  isFollowing && styles.followBtnActive,
                ]}
                onPress={() => onFollow?.(post.author?._id)}
              >
                {isFollowing ? (
                  <UserMinus size={12} color={BRAND} />
                ) : (
                  <UserPlus size={12} color="#fff" />
                )}
                <Text
                  style={[
                    styles.followBtnText,
                    isFollowing && styles.followBtnTextActive,
                  ]}
                >
                  {isFollowing ? "Following" : "Follow"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          {post.author?.userName && (
            <Text style={styles.authorHandle}>@{post.author.userName}</Text>
          )}
        </View>
        <Text style={styles.timeAgo}>{timeAgo(post.createdAt)}</Text>
      </View>

      {/* Content */}
      <Text style={styles.content}>{post.content}</Text>

      {/* Media */}
      {post.mediaUrls?.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
          {post.mediaUrls.map((url, i) => (
            <Image key={i} source={{ uri: url }} style={styles.mediaImg} cachePolicy="memory-disk" transition={200} />
          ))}
        </ScrollView>
      )}

      {/* Analytics bar */}
      <View style={styles.analyticsRow}>
        <Text style={styles.analyticsText}>{post.likesCount ?? 0} likes</Text>
        <Text style={styles.analyticsText}>{post.commentsCount ?? 0} comments</Text>
        <Text style={styles.analyticsText}>{post.views ?? 0} views</Text>
      </View>

      {/* Action row */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
          <Animated.View style={{ transform: [{ scale: likeAnim }] }}>
            <Heart
              size={22}
              color={post.isLiked ? "#FB3857" : "#888"}
              fill={post.isLiked ? "#FB3857" : "transparent"}
            />
          </Animated.View>
          <Text style={[styles.actionLabel, post.isLiked && { color: "#FB3857" }]}>
            {post.likesCount ?? 0}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn}>
          <MessageCircle size={22} color="#888" />
          <Text style={styles.actionLabel}>{post.commentsCount ?? 0}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
          <Share2 size={22} color="#888" />
          <Text style={styles.actionLabel}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={() => onSave(post._id)}>
          <Bookmark
            size={22}
            color={post.isSaved ? BRAND : "#888"}
            fill={post.isSaved ? BRAND : "transparent"}
          />
        </TouchableOpacity>
      </View>

      {/* Comments header */}
      <View style={styles.commentsHeader}>
        <Text style={styles.commentsTitle}>Comments</Text>
      </View>

      {comments.length === 0 && (
        <Text style={styles.emptyComments}>No comments yet. Be the first!</Text>
      )}
    </View>
  );

  return (
    <BaseModal visible={visible} onClose={onClose} fullScreen>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onClose} hitSlop={10}>
          <ChevronLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Post</Text>
        <TouchableOpacity onPress={() => setShowOptions(true)} hitSlop={10}>
          <MoreHorizontal size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 10 : 0}
      >
        <FlatList
          data={flatComments}
          keyExtractor={(item, index) => item._id ?? String(index)}
          renderItem={renderComment}
          ListHeaderComponent={PostHeader}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />

        {/* Reply indicator */}
        {replyTo && (
          <View style={styles.replyIndicator}>
            <Text style={styles.replyText}>
              Replying to <Text style={{ fontFamily: "OutfitBold" }}>{displayName(replyTo.author)}</Text>
            </Text>
            <TouchableOpacity onPress={() => setReplyTo(null)}>
              <Text style={styles.replyCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Comment input */}
        <View style={[styles.inputRow, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          <TextInput
            style={styles.input}
            placeholder={replyTo ? `Reply to ${displayName(replyTo.author)}…` : "Add a comment…"}
            placeholderTextColor="#BBB"
            value={text}
            onChangeText={setText}
            multiline
            maxLength={300}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
            onPress={handleSubmit}
            disabled={!text.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Send size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Post options modal (rendered inside PostDetailModal) */}
      <PostOptionsModal
        visible={showOptions}
        onClose={() => setShowOptions(false)}
        onSelect={handleOptionSelect}
        isFollowing={isFollowing}
        isSaved={post.isSaved}
        isOwnPost={isOwnPost}
      />
    </BaseModal>
  );
};

export default PostDetailModal;

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  topTitle: {
    fontSize: 17,
    fontFamily: "OutfitBold",
    color: '#E5E5E5',
  },
  postContainer: {
    padding: 16,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  authorAvatar: { width: 44, height: 44, borderRadius: 22 },
  avatarFallback: {
    backgroundColor: BRAND,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "OutfitBold",
  },
  nameFollowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  authorName: {
    fontSize: 15,
    fontFamily: "OutfitBold",
    color: '#E5E5E5',
  },
  followBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: BRAND,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  followBtnActive: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: BRAND,
  },
  followBtnText: {
    fontSize: 11,
    fontFamily: "OutfitBold",
    color: "#fff",
  },
  followBtnTextActive: {
    color: BRAND,
  },
  authorHandle: {
    fontSize: 13,
    fontFamily: "Outfit",
    color: "#999",
  },
  timeAgo: {
    fontSize: 12,
    fontFamily: "Outfit",
    color: "#BBB",
  },
  content: {
    fontSize: 16,
    fontFamily: "Outfit",
    color: "#222",
    lineHeight: 24,
    marginBottom: 4,
  },
  mediaImg: {
    width: SW * 0.75,
    height: SW * 0.75,
    borderRadius: 12,
    marginRight: 8,
    marginTop: 4,
  },
  analyticsRow: {
    flexDirection: "row",
    gap: 14,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  analyticsText: {
    fontSize: 13,
    fontFamily: "Outfit",
    color: "#BBB",
  },
  actionRow: {
    flexDirection: "row",
    gap: 24,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  actionLabel: {
    fontSize: 14,
    fontFamily: "Outfit",
    color: "#888",
  },
  commentsHeader: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  commentsTitle: {
    fontSize: 16,
    fontFamily: "OutfitBold",
    color: '#E5E5E5',
  },
  emptyComments: {
    color: "#BBB",
    textAlign: "center",
    paddingVertical: 20,
    fontFamily: "Outfit",
  },
  commentRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  commentAvatar: { width: 32, height: 32, borderRadius: 16 },
  commentAvatarFallback: {
    backgroundColor: BRAND,
    justifyContent: "center",
    alignItems: "center",
  },
  commentAvatarInitial: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "OutfitBold",
  },
  commentBody: { flex: 1 },
  commentAuthor: {
    fontSize: 13,
    fontFamily: "OutfitBold",
    color: '#E5E5E5',
  },
  commentText: {
    fontSize: 14,
    fontFamily: "Outfit",
    color: '#D1D5DB',
    marginTop: 2,
    lineHeight: 20,
  },
  commentActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 6,
  },
  commentTime: {
    fontSize: 11,
    fontFamily: "Outfit",
    color: "#BBB",
  },
  commentActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  commentActionText: {
    fontSize: 11,
    fontFamily: "Outfit",
    color: "#BBB",
  },
  replyIndicator: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1E1E1E',
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  replyText: {
    fontSize: 13,
    fontFamily: "Outfit",
    color: "#888",
  },
  replyCancelText: {
    fontSize: 13,
    fontFamily: "OutfitBold",
    color: BRAND,
  },
  replyRow: {
    paddingLeft: 38,
    backgroundColor: '#1E1E1E',
  },
  replyIconCol: {
    position: "absolute",
    left: 18,
    top: 12,
  },
  replyAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  inputRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#333333',
    backgroundColor: "#121212",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    padding: 10,
    fontSize: 14,
    fontFamily: "Outfit",
    color: '#E5E5E5',
    minHeight: 42,
    maxHeight: 100,
    textAlignVertical: "top",
  },
  sendBtn: {
    backgroundColor: BRAND,
    borderRadius: 99,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnDisabled: { opacity: 0.45 },
});
