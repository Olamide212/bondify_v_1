import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import DiscoverCard from "../../../../components/discoverScreen/DiscoverCard";
import { styles } from "../../../../styles/discoverStyles";
import GeneralHeader from "../../../../components/headers/GeneralHeader";

const DiscoverScreen = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("all");

  // Define discover categories
  const discoverCategories = [
    {
      id: "1",
      name: "Christian searching for Love",
      members: "12.4k",
      icon: "🙏",
      description:
        "Connect with Christian singles seeking meaningful relationships",
      preference: "Christian searching for Love",
      recentActivity: "124 active today",
    },
    {
      id: "2",
      name: "Muslim searching for love",
      members: "8.7k",
      icon: "☪️",
      description: "Connect with Muslim singles in a halal environment",
      preference: "muslim searching for love",
      recentActivity: "87 active today",
    },
    {
      id: "3",
      name: "Traditionalist searching for love",
      members: "6.2k",
      icon: "🪔",
      description:
        "Meet traditionalists who value culture and spiritual connection",
      preference: "Traditionalist searching for love",
      recentActivity: "45 active today",
    },
    {
      id: "4",
      name: "Short-term fun",
      members: "15.2k",
      icon: "🎉",
      description: "For those looking for short-term relationships and fun",
      preference: "Short-term fun",
      recentActivity: "215 active today",
    },
    {
      id: "5",
      name: "Long-term relationship",
      members: "20.1k",
      icon: "💑",
      description: "Find someone for a long-term committed relationship",
      preference: "Long-term relationship",
      recentActivity: "189 active today",
    },
  ];

  // Background colors for each list item
  const backgroundColors = [
    "#FFE5E5", // light red
    "#E5F7FF", // light blue
    "#E5FFE9", // light green
    "#FFF6E5", // light orange
    "#F0E5FF", // light purple
  ];

  const navigateToCategory = (category) => {
    router.push({
      pathname: "/profiles",
      params: {
        preference: category.preference,
        title: category.name,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <GeneralHeader title="Discover" />

      <FlatList
        data={discoverCategories}
        renderItem={({ item, index }) => (
          <DiscoverCard
            category={item}
            onPress={() => navigateToCategory(item)}
            backgroundColor={backgroundColors[index % backgroundColors.length]}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

export default DiscoverScreen;
