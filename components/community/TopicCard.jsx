import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { styles } from "./styles/communityStyles";

const TopicCard = ({ topic, onPress }) => {
  return (
    <TouchableOpacity style={styles.topicCard} onPress={onPress}>
      <Text style={styles.topicIcon}>{topic.icon}</Text>
      <View style={styles.topicInfo}>
        <Text style={styles.topicTitle}>{topic.title}</Text>
        <Text style={styles.topicPosts}>{topic.posts} posts</Text>
      </View>
      <ChevronRight size={20} color="#666" />
    </TouchableOpacity>
  );
};

export default TopicCard;
