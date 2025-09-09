import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { ChevronRight, Heart, MessageCircle } from "lucide-react-native";
import { styles } from "./styles/communityStyles";

const CommunityCard = ({ community, onPress }) => {
  return (
    <TouchableOpacity style={styles.communityCard} onPress={onPress}>
      <View style={styles.communityHeader}>
        <Image source={{ uri: community.icon }} style={styles.communityIcon} />
        <View style={styles.communityInfo}>
          <Text style={styles.communityName}>{community.name}</Text>
          <Text style={styles.communityMembers}>
            {community.members} members
          </Text>
        </View>
        <ChevronRight size={20} color="#666" />
      </View>

      <Text style={styles.communityDescription}>{community.description}</Text>

      <View style={styles.recentPost}>
        <Text style={styles.recentPostLabel}>Recent post:</Text>
        <Text style={styles.recentPostContent}>
          "{community.recentPost.content}"
        </Text>
        <View style={styles.postMeta}>
          <Text style={styles.postUser}>by {community.recentPost.user}</Text>
          <View style={styles.postStats}>
            <View style={styles.statItem}>
              <Heart size={14} color="#666" />
              <Text style={styles.statText}>{community.recentPost.likes}</Text>
            </View>
            <View style={styles.statItem}>
              <MessageCircle size={14} color="#666" />
              <Text style={styles.statText}>
                {community.recentPost.comments}
              </Text>
            </View>
            <Text style={styles.postTime}>{community.recentPost.time}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default CommunityCard;
