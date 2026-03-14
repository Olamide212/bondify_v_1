import {
  Bookmark,
  ChevronLeft,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Send,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../../constant/colors";
import BaseModal from "../modals/BaseModal";

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
}) => {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [likeAnim] = useState(new Animated.Value(1));

  if (!post) return null;

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
    await onSubmitComment(post._id, text.trim());
    setText("");
    setLoading(false);
  };

  const comments = post.comments ?? [];

  const renderComment = ({ item }) => (
    <View style={styles.commentRow}>
      {avatarUrl(item.author) ? (
        <Image source={{ uri: avatarUrl(item.author) }} style={styles.commentAvatar} />
      ) : (
        <View style={[styles.commentAvatar, styles.commentAvatarFallback]}>
          <Text style={styles.commentAvatarInitial}>
            {displayName(item.author)?.[0]?.toUpperCase()}
          </Text>
        </View>
      )}
      <View style={styles.commentBody}>
        <Text style={styles.commentAuthor}>{displayName(item.author)}</Text>
        <Text style={styles.commentText}>{item.content}</Text>
        <Text style={styles.commentTime}>{timeAgo(item.createdAt)}</Text>
      </View>
    </View>
  );

  const PostHeader = () => (
    <View style={styles.postContainer}>
      {/* Author row */}
      <View style={styles.authorRow}>
        {avatarUrl(post.author) ? (
          <Image source={{ uri: avatarUrl(post.author) }} style={styles.authorAvatar} />
        ) : (
          <View style={[styles.authorAvatar, styles.avatarFallback]}>
            <Text style={styles.avatarInitial}>
              {displayName(post.author)?.[0]?.toUpperCase()}
            </Text>
          </View>
        )}
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.authorName}>{displayName(post.author)}</Text>
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
            <Image key={i} source={{ uri: url }} style={styles.mediaImg} />
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
        <TouchableOpacity onPress={() => onOpenOptions?.(post)} hitSlop={10}>
          <MoreHorizontal size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          data={comments}
          keyExtractor={(item, index) => item._id ?? String(index)}
          renderItem={renderComment}
          ListHeaderComponent={PostHeader}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />

        {/* Comment input */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Add a comment…"
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
    borderBottomColor: "#F0F0F0",
  },
  topTitle: {
    fontSize: 17,
    fontFamily: "PlusJakartaSansBold",
    color: "#111",
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
    fontFamily: "PlusJakartaSansBold",
  },
  authorName: {
    fontSize: 15,
    fontFamily: "PlusJakartaSansBold",
    color: "#111",
  },
  authorHandle: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans",
    color: "#999",
  },
  timeAgo: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans",
    color: "#BBB",
  },
  content: {
    fontSize: 16,
    fontFamily: "PlusJakartaSans",
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
    fontFamily: "PlusJakartaSans",
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
    fontFamily: "PlusJakartaSans",
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
    fontFamily: "PlusJakartaSansBold",
    color: "#111",
  },
  emptyComments: {
    color: "#BBB",
    textAlign: "center",
    paddingVertical: 20,
    fontFamily: "PlusJakartaSans",
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
    fontFamily: "PlusJakartaSansBold",
  },
  commentBody: { flex: 1 },
  commentAuthor: {
    fontSize: 13,
    fontFamily: "PlusJakartaSansBold",
    color: "#111",
  },
  commentText: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans",
    color: "#444",
    marginTop: 2,
    lineHeight: 20,
  },
  commentTime: {
    fontSize: 11,
    fontFamily: "PlusJakartaSans",
    color: "#BBB",
    marginTop: 4,
  },
  inputRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 10,
    fontSize: 14,
    fontFamily: "PlusJakartaSans",
    color: "#111",
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
