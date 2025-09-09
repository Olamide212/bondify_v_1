import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  SafeAreaView,
  StatusBar,
  Image,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Heart,
  MessageCircle,
  Share,
  ChevronLeft,
  Send,
  MoreHorizontal,
  X
} from "lucide-react-native";
import Comment from "../../../../components/community/Comment";
import { styles } from "../../../../components/community/styles/communityStyles";

const PostDetailScreen = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);

  useEffect(() => {
    // Fetch post data based on ID - replace with API call
    const mockPost = {
      id: id,
      user: {
        name: "Sarah M.",
        avatar: "https://example.com/avatar1.jpg",
        verified: true,
      },
      content:
        "How do you balance faith and dating in today's world? I'm struggling to find someone who shares my values.",
      time: "2h ago",
      likes: 24,
      comments: 8,
      liked: false,
      image: null,
    };

    setPost(mockPost);

    // Mock comments data - replace with API call
    setComments([
      {
        id: "1",
        user: {
          name: "John D.",
          avatar: "https://example.com/avatar2.jpg",
          verified: false,
        },
        content:
          "I found that being upfront about my faith from the beginning really helped filter out incompatible matches.",
        time: "1h ago",
        likes: 5,
        liked: false,
        replies: [
          {
            id: "1-1",
            user: {
              name: "Sarah M.",
              avatar: "https://example.com/avatar1.jpg",
              verified: true,
            },
            content: "That makes sense. How early do you bring it up?",
            time: "45m ago",
            likes: 2,
            liked: false,
          },
        ],
      },
      {
        id: "2",
        user: {
          name: "Maria L.",
          avatar: "https://example.com/avatar3.jpg",
          verified: true,
        },
        content:
          "I joined a faith-based dating community and it made a huge difference!",
        time: "30m ago",
        likes: 3,
        liked: true,
        replies: [],
      },
    ]);
  }, [id]);

  const handleLikePost = () => {
    setPost({
      ...post,
      likes: post.liked ? post.likes - 1 : post.likes + 1,
      liked: !post.liked,
    });
  };

  const handleLikeComment = (commentId) => {
    setComments(
      comments.map((comment) => {
        if (comment.id === commentId) {
          return {
            ...comment,
            likes: comment.liked ? comment.likes - 1 : comment.likes + 1,
            liked: !comment.liked,
          };
        }
        return comment;
      })
    );
  };

  const handleLikeReply = (commentId, replyId) => {
    setComments(
      comments.map((comment) => {
        if (comment.id === commentId) {
          return {
            ...comment,
            replies: comment.replies.map((reply) => {
              if (reply.id === replyId) {
                return {
                  ...reply,
                  likes: reply.liked ? reply.likes - 1 : reply.likes + 1,
                  liked: !reply.liked,
                };
              }
              return reply;
            }),
          };
        }
        return comment;
      })
    );
  };

  const handleReply = (comment) => {
    setReplyingTo(comment);
    setNewComment(`@${comment.user.name} `);
  };

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;

    if (replyingTo) {
      // Add reply to existing comment
      setComments(
        comments.map((comment) => {
          if (comment.id === replyingTo.id) {
            return {
              ...comment,
              replies: [
                ...comment.replies,
                {
                  id: `${comment.id}-${comment.replies.length + 1}`,
                  user: {
                    name: "Current User",
                    avatar: "https://example.com/current.jpg",
                    verified: false,
                  },
                  content: newComment,
                  time: "Just now",
                  likes: 0,
                  liked: false,
                },
              ],
            };
          }
          return comment;
        })
      );
      setReplyingTo(null);
    } else {
      // Add new top-level comment
      setComments([
        {
          id: Date.now().toString(),
          user: {
            name: "Current User",
            avatar: "https://example.com/current.jpg",
            verified: false,
          },
          content: newComment,
          time: "Just now",
          likes: 0,
          liked: false,
          replies: [],
        },
        ...comments,
      ]);
    }

    setNewComment("");
  };

  if (!post) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.postDetailHeader}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.postDetailTitle}>Post</Text>
        <TouchableOpacity>
          <MoreHorizontal size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={90}
      >
        <FlatList
          data={comments}
          renderItem={({ item }) => (
            <Comment
              comment={item}
              onLike={() => handleLikeComment(item.id)}
              onReply={() => handleReply(item)}
              onLikeReply={(replyId) => handleLikeReply(item.id, replyId)}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.commentsList}
          ListHeaderComponent={
            <View style={styles.postDetailCard}>
              <View style={styles.postHeader}>
                <Image
                  source={{ uri: post.user.avatar }}
                  style={styles.postAvatar}
                />
                <View style={styles.postUserInfo}>
                  <Text style={styles.postUserName}>{post.user.name}</Text>
                  <Text style={styles.postTime}>{post.time}</Text>
                </View>
                {post.user.verified && (
                  <Image
                    source={require("../../../../assets/icons/verified-icon.png")}
                    style={styles.verifiedIcon}
                  />
                )}
              </View>

              <Text style={styles.postContent}>{post.content}</Text>

              {post.image && (
                <Image source={{ uri: post.image }} style={styles.postImage} />
              )}

              <View style={styles.postActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleLikePost}
                >
                  <Heart
                    size={20}
                    color={post.liked ? "#E91E63" : "#666"}
                    fill={post.liked ? "#E91E63" : "none"}
                  />
                  <Text
                    style={[styles.actionText, post.liked && styles.likedText]}
                  >
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
            </View>
          }
        />

        <View style={styles.commentInputContainer}>
          {replyingTo && (
            <View style={styles.replyingToContainer}>
              <Text style={styles.replyingToText}>
                Replying to @{replyingTo.user.name}
              </Text>
              <TouchableOpacity onPress={() => setReplyingTo(null)}>
                <X size={16} color="#666" />
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.commentInputRow}>
            <TextInput
              placeholder={
                replyingTo ? "Write a reply..." : "Write a comment..."
              }
              style={styles.commentInput}
              value={newComment}
              onChangeText={setNewComment}
              multiline
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                !newComment.trim() && styles.sendButtonDisabled,
              ]}
              onPress={handleSubmitComment}
              disabled={!newComment.trim()}
            >
              <Send size={20} color={newComment.trim() ? "#3B82F6" : "#CCC"} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default PostDetailScreen;
