import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Heart, MessageCircle, Share } from "lucide-react-native";
import { styles } from "./styles/communityStyles";
import { useRouter } from "expo-router";

const PostCard = ({ post, onLike }) => {
const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.postCard}
      onPress={() => router.push(`/post/${post.id}`)}
    >
      <View style={styles.postHeader}>
        <Image source={{ uri: post.user.avatar }} style={styles.postAvatar} />
        <View style={styles.postUserInfo}>
          <Text style={styles.postUserName}>{post.user.name}</Text>
          <Text style={styles.postTime}>{post.time}</Text>
        </View>
        {post.user.verified && (
          <Image
            source={require("../../assets/icons/verified-icon.png")}
            style={styles.verifiedIcon}
          />
        )}
      </View>

      <Text style={styles.postContent}>{post.content}</Text>

      <View style={styles.postActions}>
        <TouchableOpacity style={styles.actionButton} onPress={onLike}>
          <Heart
            size={20}
            color={post.liked ? "#E91E63" : "#666"}
            fill={post.liked ? "#E91E63" : "none"}
          />
          <Text style={[styles.actionText, post.liked && styles.likedText]}>
            {post.likes}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <MessageCircle size={20} color="#666" />
          <Text style={styles.actionText}>{post.comments}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Share size={20} color="#666" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export default PostCard;
