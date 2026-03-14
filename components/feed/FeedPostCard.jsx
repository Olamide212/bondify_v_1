import {
  Bookmark,
  Heart,
  MessageCircle,
  MoreHorizontal,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../../constant/colors";

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

const FeedPostCard = ({
  post,
  currentUserId,
  onLike,
  onSave,
  onPress,
  onOpenOptions,
}) => {
  const [likeAnim] = useState(new Animated.Value(1));

  const handleLike = () => {
    Animated.sequence([
      Animated.timing(likeAnim, { toValue: 1.4, duration: 100, useNativeDriver: true }),
      Animated.timing(likeAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    onLike(post._id);
  };

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(post)} activeOpacity={0.7}>
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

        {/* 3-dots menu icon */}
        <TouchableOpacity
          onPress={() => onOpenOptions(post)}
          hitSlop={10}
          style={styles.moreBtn}
        >
          <MoreHorizontal size={20} color="#999" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <Text style={styles.content} numberOfLines={6}>{post.content}</Text>

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
              size={20}
              color={post.isLiked ? "#FB3857" : "#888"}
              fill={post.isLiked ? "#FB3857" : "transparent"}
            />
          </Animated.View>
          <Text style={[styles.actionLabel, post.isLiked && { color: "#FB3857" }]}>
            {post.likesCount ?? 0}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={() => onPress(post)}>
          <MessageCircle size={20} color="#888" />
          <Text style={styles.actionLabel}>{post.commentsCount ?? 0}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={() => onSave(post._id)}>
          <Bookmark
            size={20}
            color={post.isSaved ? BRAND : "#888"}
            fill={post.isSaved ? BRAND : "transparent"}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export default FeedPostCard;

const styles = StyleSheet.create({
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
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  authorAvatar: { width: 40, height: 40, borderRadius: 20 },
  avatarFallback: {
    backgroundColor: BRAND,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "PlusJakartaSansBold",
  },
  authorName: {
    fontSize: 14,
    fontFamily: "PlusJakartaSansBold",
    color: "#111",
  },
  authorHandle: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans",
    color: "#999",
  },
  timeAgo: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans",
    color: "#BBB",
    marginRight: 8,
  },
  moreBtn: {
    padding: 4,
  },
  content: {
    fontSize: 15,
    fontFamily: "PlusJakartaSans",
    color: "#222",
    lineHeight: 22,
  },
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
  analyticsText: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans",
    color: "#BBB",
  },
  actionRow: {
    flexDirection: "row",
    gap: 20,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  actionLabel: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans",
    color: "#888",
  },
});
