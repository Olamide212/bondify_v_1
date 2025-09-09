import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  SafeAreaView,
  StatusBar,
  Image,
  TouchableOpacity
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import TopicCard from "../../../../components/community/TopicCard";
import CreatePostButton from "../../../../components/community/CreatePostButton";
import { styles } from "../../../../components/community/styles/communityStyles";

const CommunityDetailScreen = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [community, setCommunity] = useState(null);
  const [topics, setTopics] = useState([]);
  const [activeTopic, setActiveTopic] = useState("all");

  useEffect(() => {
    // Fetch community data based on ID - replace with API call
    const mockCommunity = {
      id: id,
      name:
        id === "1"
          ? "Christian Daters"
          : id === "2"
            ? "Muslim Daters"
            : id === "3"
              ? "Events"
              : "Daters",
      members:
        id === "1"
          ? "12.4k"
          : id === "2"
            ? "8.7k"
            : id === "3"
              ? "5.2k"
              : "23.1k",
      icon: "https://example.com/icon.png",
      description:
        id === "1"
          ? "A community for Christian singles seeking meaningful relationships"
          : id === "2"
            ? "Connecting Muslim singles in a halal environment"
            : id === "3"
              ? "Find and share dating events in your area"
              : "General discussion about dating experiences",
    };

    setCommunity(mockCommunity);

    // Mock topics data - replace with API call
    setTopics([
      {
        id: "1",
        title: "Dating Advice",
        posts: 342,
        icon: "💡",
      },
      {
        id: "2",
        title: "Success Stories",
        posts: 128,
        icon: "✨",
      },
      {
        id: "3",
        title: "Q&A",
        posts: 287,
        icon: "❓",
      },
      {
        id: "4",
        title: "Faith & Values",
        posts: 196,
        icon: "🙏",
      },
      {
        id: "5",
        title: "Meeting People",
        posts: 231,
        icon: "👥",
      },
    ]);
  }, [id]);

  const navigateToTopic = (topic) => {
    router.push(`/topic/${topic.id}?communityId=${id}`);
  };

  if (!community) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.communityHeaderDetail}>
        <Image
          source={{ uri: community.icon }}
          style={styles.communityIconLarge}
        />
        <View style={styles.communityInfoDetail}>
          <Text style={styles.communityNameDetail}>{community.name}</Text>
          <Text style={styles.communityMembersDetail}>
            {community.members} members
          </Text>
          <Text style={styles.communityDescriptionDetail}>
            {community.description}
          </Text>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TabButton
          label="All Topics"
          isActive={activeTopic === "all"}
          onPress={() => setActiveTopic("all")}
        />
        <TabButton
          label="Popular"
          isActive={activeTopic === "popular"}
          onPress={() => setActiveTopic("popular")}
        />
      </View>

      <FlatList
        data={topics}
        renderItem={({ item }) => (
          <TopicCard topic={item} onPress={() => navigateToTopic(item)} />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />

      <CreatePostButton />
    </SafeAreaView>
  );
};

const TabButton = ({ label, isActive, onPress }) => (
  <TouchableOpacity
    style={[styles.tab, isActive && styles.activeTab]}
    onPress={onPress}
  >
    <Text style={[styles.tabText, isActive && styles.activeTabText]}>
      {label}
    </Text>
  </TouchableOpacity>
);

export default CommunityDetailScreen;
