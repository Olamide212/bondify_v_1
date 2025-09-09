import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import {
  Heart,
  MessageCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react-native";
import { styles } from "./styles/communityStyles";
import {Icons} from "../../constant/icons"

const Comment = ({ comment, onLike, onReply, onLikeReply }) => {
  const [expanded, setExpanded] = useState(true);
  const [showAllReplies, setShowAllReplies] = useState(false);

  const displayedReplies = showAllReplies
    ? comment.replies
    : comment.replies.slice(0, 2);

  return (
    <View style={styles.commentContainer}>
      <View style={styles.commentHeader}>
        <Image
          source={{ uri: comment.user.avatar }}
          style={styles.commentAvatar}
        />
        <View style={styles.commentUserInfo}>
          <Text style={styles.commentUserName}>{comment.user.name}</Text>
          <Text style={styles.commentTime}>{comment.time}</Text>
        </View>
        {comment.user.verified && (
          <Image source={Icons.verified} style={styles.verifiedIconSmall} />
        )}
      </View>

      <Text style={styles.commentContent}>{comment.content}</Text>

      <View style={styles.commentActions}>
        <TouchableOpacity style={styles.commentActionButton} onPress={onLike}>
          <Heart
            size={16}
            color={comment.liked ? "#E91E63" : "#666"}
            fill={comment.liked ? "#E91E63" : "none"}
          />
          <Text
            style={[
              styles.commentActionText,
              comment.liked && styles.likedText,
            ]}
          >
            {comment.likes}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.commentActionButton} onPress={onReply}>
          <MessageCircle size={16} color="#666" />
          <Text style={styles.commentActionText}>Reply</Text>
        </TouchableOpacity>
      </View>

      {comment.replies.length > 0 && (
        <View style={styles.repliesContainer}>
          <TouchableOpacity
            style={styles.toggleRepliesButton}
            onPress={() => setExpanded(!expanded)}
          >
            <Text style={styles.toggleRepliesText}>
              {expanded ? "Hide" : "Show"} {comment.replies.length} replies
            </Text>
            {expanded ? (
              <ChevronUp size={16} color="#666" />
            ) : (
              <ChevronDown size={16} color="#666" />
            )}
          </TouchableOpacity>

          {expanded && (
            <View style={styles.repliesList}>
              {displayedReplies.map((reply) => (
                <View key={reply.id} style={styles.replyContainer}>
                  <View style={styles.replyHeader}>
                    <Image
                      source={{ uri: reply.user.avatar }}
                      style={styles.replyAvatar}
                    />
                    <View style={styles.replyUserInfo}>
                      <Text style={styles.replyUserName}>
                        {reply.user.name}
                      </Text>
                      <Text style={styles.replyTime}>{reply.time}</Text>
                    </View>
                    {reply.user.verified && (
                      <Image
                        source={Icons.verified}
                        style={styles.verifiedIconSmall}
                      />
                    )}
                  </View>

                  <Text style={styles.replyContent}>{reply.content}</Text>

                  <View style={styles.replyActions}>
                    <TouchableOpacity
                      style={styles.replyActionButton}
                      onPress={() => onLikeReply(reply.id)}
                    >
                      <Heart
                        size={14}
                        color={reply.liked ? "#E91E63" : "#666"}
                        fill={reply.liked ? "#E91E63" : "none"}
                      />
                      <Text
                        style={[
                          styles.replyActionText,
                          reply.liked && styles.likedText,
                        ]}
                      >
                        {reply.likes}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {comment.replies.length > 2 && !showAllReplies && (
                <TouchableOpacity
                  style={styles.showMoreButton}
                  onPress={() => setShowAllReplies(true)}
                >
                  <Text style={styles.showMoreText}>
                    Show {comment.replies.length - 2} more replies
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
};

export default Comment;
