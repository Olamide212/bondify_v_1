import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  SafeAreaView,
  StatusBar,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import PostCard from "../../../../components/community/PostCard";
import CreatePostButton from "../../../../components/community/CreatePostButton";
import { styles } from "../../../../components/community/styles/communityStyles";

const TopicScreen = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [topic, setTopic] = useState(null);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    // Fetch topic data based on ID - replace with API call
    const topicTitles = {
      1: "Dating Advice",
      2: "Success Stories",
      3: "Q&A",
      4: "Faith & Values",
      5: "Meeting People",
    };

    setTopic({
      id: id,
      title: topicTitles[id] || "General Discussion",
      posts:
        id === "1"
          ? 342
          : id === "2"
            ? 128
            : id === "3"
              ? 287
              : id === "4"
                ? 196
                : 231,
    });

    // Mock posts data - replace with API call
    setPosts([
      {
        id: "1",
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
      },
      {
        id: "2",
        user: {
          name: "John D.",
          avatar: "https://example.com/avatar2.jpg",
          verified: false,
        },
        content:
          "Just wanted to share that I met my partner through this community a year ago! Don't give up hope everyone!",
        time: "5h ago",
        likes: 87,
        comments: 23,
        liked: true,
      },
    ]);
  }, [id]);

  const handleLike = (postId) => {
    setPosts(
      posts.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            likes: post.liked ? post.likes - 1 : post.likes + 1,
            liked: !post.liked,
          };
        }
        return post;
      })
    );
  };

  if (!topic) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.topicHeader}>
        <Text style={styles.topicTitleHeader}>{topic.title}</Text>
        <Text style={styles.topicPostsCount}>{topic.posts} posts</Text>
      </View>

      <FlatList
        data={posts}
        renderItem={({ item }) => (
          <PostCard post={item} onLike={() => handleLike(item.id)} />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />

      <CreatePostButton />
    </SafeAreaView>
  );
};

export default TopicScreen;
