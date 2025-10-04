import React, { useState } from "react";
import { View, ScrollView, Dimensions, StyleSheet } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import GeneralHeader from "../../../../components/headers/GeneralHeader";
import TabNavigation from "../../../../components/explore/exploreScreenTab";
import VisitedYou from "../../../../components/explore/visitedYou";
import LikedYou from "../../../../components/explore/LikedYou";
import YouLiked from "../../../../components/explore/YouLiked";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 30) / 2;

// Mock data (would typically come from API or state management)
const VisitedYouData = [
  {
    id: 1,
    name: "Emma",
    age: 26,
    distance: "2 miles away",
    image:
      "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=600&fit=crop",
    verified: true,
    likedMe: false,
    timeAgo: "2h",
  },
  {
    id: 2,
    name: "Sarah",
    age: 24,
    distance: "5 miles away",
    image:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=600&fit=crop",
    verified: false,
    likedMe: false,
    timeAgo: "4h",
  },
];

const LikedYouData = [
  {
    id: 3,
    name: "Sophia",
    age: 29,
    distance: "3 miles away",
    image:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=600&fit=crop",
    verified: true,
    likedMe: true,
    timeAgo: "1h",
  },
  {
    id: 4,
    name: "Isabella",
    age: 26,
    distance: "2 miles away",
    image:
      "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=600&fit=crop",
    verified: false,
    likedMe: true,
    timeAgo: "3h",
  },
  {
    id: 5,
    name: "Mia",
    age: 25,
    distance: "4 miles away",
    image:
      ["https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=600&fit=crop", "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=600&fit=crop"],
    verified: true,
    likedMe: true,
    timeAgo: "5h",
  },
];

const YouLikedData = [
  {
    id: 6,
    name: "Olivia",
    age: 27,
    distance: "1 mile away",
    image: [
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=600&fit=crop",
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=600&fit=crop",
    ],
    verified: true,
    likedMe: false,
    timeAgo: "1d",
  },
  {
    id: 7,
    name: "Ava",
    age: 23,
    distance: "3 miles away",
    image: [
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=600&fit=crop",
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=600&fit=crop",
    ],
    verified: false,
    likedMe: false,
    timeAgo: "2d",
  },
];

export default function ExploreTabComponents() {
  const [activeTab, setActiveTab] = useState("visitedYou");
  const [selectedUsers, setSelectedUsers] = useState([]);

  const handleUserPress = (userId) => {
    if (activeTab === "likedYou") {
      setSelectedUsers((prev) =>
        prev.includes(userId)
          ? prev.filter((id) => id !== userId)
          : [...prev, userId]
      );
    }
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case "visitedYou":
        return (
          <VisitedYou data={VisitedYouData} onUserPress={handleUserPress} />
        );
      case "likedYou":
        return (
          <LikedYou
            data={LikedYouData}
            onUserPress={handleUserPress}
            selectedUsers={selectedUsers}
          />
        );
      case "youLiked":
        return <YouLiked data={YouLikedData} onUserPress={handleUserPress} />;
      default:
        return (
          <VisitedYou data={VisitedYouData} onUserPress={handleUserPress} />
        );
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, }}>
        <GeneralHeader title="Discover" />
        <View >
          <TabNavigation
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            visitedCount={VisitedYouData.length}
            likedCount={LikedYouData.length}
            youLikedCount={YouLikedData.length}
          />
        </View>

        <ScrollView style={{ flex: 1,  }}>{renderActiveTab()}</ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}


const styles = StyleSheet.create({
  actionButtonWrapper: {
    position: "absolute",
    top: 110,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
});