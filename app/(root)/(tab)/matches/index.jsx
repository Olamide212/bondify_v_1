import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  FlatList,
} from "react-native";
import {
  Heart,
  MessageCircle,
  Star,
  SlidersHorizontal,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { ScrollView } from "react-native-gesture-handler";
import GeneralHeader from "../../../../components/headers/GeneralHeader";

const { width } = Dimensions.get("window");
const CARD_MARGIN = 8;
const CARD_WIDTH = (width - 30) / 2; // Adjusted for padding and gap

const VisitedYou = [
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

const LikedYou = [
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
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=600&fit=crop",
    verified: true,
    likedMe: true,
    timeAgo: "5h",
  },
];

const YouLiked = [
  {
    id: 6,
    name: "Olivia",
    age: 27,
    distance: "1 mile away",
    image:
      "https://images.unsplash.com/photo-1545912452-8aea7e25a3d3?w=400&h=600&fit=crop",
    verified: true,
    likedMe: false,
    timeAgo: "1d",
  },
  {
    id: 7,
    name: "Ava",
    age: 23,
    distance: "3 miles away",
    image:
      "https://images.unsplash.com/photo-1567532939604-b6b5b0e1607d?w=400&h=600&fit=crop",
    verified: false,
    likedMe: false,
    timeAgo: "2d",
  },
];

export default function LikesMatches() {
  const [activeTab, setActiveTab] = useState("visitedYou");
  const [selectedUsers, setSelectedUsers] = useState([]);

  const currentData =
    activeTab === "visitedYou"
      ? VisitedYou
      : activeTab === "likedYou"
        ? LikedYou
        : YouLiked;

  const getTabCount = (tab) => {
    switch (tab) {
      case "visitedYou":
        return VisitedYou.length;
      case "likedYou":
        return LikedYou.length;
      case "youLiked":
        return YouLiked.length;
      default:
        return 0;
    }
  };

  const handleUserPress = (userId) => {
    if (activeTab === "likedYou") {
      setSelectedUsers((prev) =>
        prev.includes(userId)
          ? prev.filter((id) => id !== userId)
          : [...prev, userId]
      );
    }
  };

  const renderUserCard = ({ item: user }) => (
    <TouchableOpacity
      onPress={() => handleUserPress(user.id)}
      style={{
        width: CARD_WIDTH,
        marginBottom: 16,
        marginHorizontal: CARD_MARGIN / 2,
        opacity: selectedUsers.includes(user.id) ? 0.75 : 1,
      }}
    >
      <View
        style={{
          backgroundColor: "#fff",
          borderRadius: 16,
          overflow: "hidden",
          elevation: 2,
        }}
      >
        <View style={{ position: "relative" }}>
          <Image
            source={{ uri: user.image }}
            style={{ width: "100%", height: 220 }}
            resizeMode="cover"
          />

          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.7)"]}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: 100,
            }}
          />

          <View
            style={{
              position: "absolute",
              top: 10,
              left: 10,
              backgroundColor: "rgba(0,0,0,0.4)",
              borderRadius: 12,
              paddingHorizontal: 8,
              paddingVertical: 4,
            }}
          >
            <Text style={{ color: "white", fontSize: 12 }}>{user.timeAgo}</Text>
          </View>

          {user.verified && (
            <View
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                backgroundColor: "#3B82F6",
                padding: 6,
                borderRadius: 20,
              }}
            >
              <Star size={14} color="white" fill="white" />
            </View>
          )}

          {user.isMatch && (
            <View
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                backgroundColor: "#FF0066",
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 20,
              }}
            >
              <Text
                style={{ color: "white", fontSize: 12, fontWeight: "bold" }}
              >
                MATCH
              </Text>
            </View>
          )}

          <View
            style={{
              padding: 12,
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
            }}
          >
            <Text style={{ color: "white", fontSize: 16, fontWeight: "bold" }}>
              {user.name}, {user.age}
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>
              {user.distance}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-white">
        <View>
          <GeneralHeader title="Explore" />
        </View>
        <View style={{ flex: 1 }}>
          
          
          <ScrollView>
            
          
            {/* Updated Tabs with consistent styling */}
            <View
              style={{
                flexDirection: "row",
                borderColor: "#E5E7EB",
              }}
            >
              {/* Visited You Tab */}
              <TouchableOpacity
                onPress={() => setActiveTab("visitedYou")}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  alignItems: "center",
          
                }}
              >
                <Text
                  style={{
                    fontFamily: "SatoshiBold",
                    fontSize: 14,
                    color: activeTab === "visitedYou" ? "#000" : "#6B7280",
                  }}
                >
                  Visited You ({VisitedYou.length})
                </Text>
              </TouchableOpacity>

              {/* Liked You Tab */}
              <TouchableOpacity
                onPress={() => setActiveTab("likedYou")}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  alignItems: "center",
                
                }}
              >
                <Text
                  style={{
                    fontFamily: "SatoshiBold",
                    fontSize: 14,
                    color: activeTab === "likedYou" ? "#000" : "#6B7280",
                  }}
                >
                  Liked You ({LikedYou.length})
                </Text>
              </TouchableOpacity>

              {/* You Liked Tab */}
              <TouchableOpacity
                onPress={() => setActiveTab("youLiked")}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  alignItems: "center",
                
                }}
              >
                <Text
                  style={{
                    fontFamily: "SatoshiBold",
                    fontSize: 14,
                    color: activeTab === "youLiked" ? "#000" : "#6B7280",
                  }}
                >
                  You Liked ({YouLiked.length})
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ padding: 16 }}>
              {/* Visited You Banner */}
              {activeTab === "visitedYou" && (
                <LinearGradient
                  colors={["#4F46E5", "#7C3AED"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 16,
                  }}
                >
                  <Text
                    style={{
                      color: "white",
                      fontSize: 16,
                      fontFamily: "SatoshiBold",
                      marginBottom: 4,
                    }}
                  >
                    👀 {VisitedYou.length} people visited your profile!
                  </Text>
                  <Text
                    style={{
                      color: "white",
                      fontSize: 14,
                      fontFamily: "SatoshiMedium",
                    }}
                  >
                    Check out who's interested in you.
                  </Text>
                </LinearGradient>
              )}

              {/* Liked You Banner */}
              {activeTab === "likedYou" && (
                <LinearGradient
                  colors={["#FD465C", "#A80EC1"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 16,
                  }}
                >
                  <Text
                    style={{
                      color: "white",
                      fontSize: 16,
                      fontFamily: "SatoshiBold",
                      marginBottom: 4,
                    }}
                  >
                    💕 {LikedYou.length} people like you!
                  </Text>
                  <Text
                    style={{
                      color: "white",
                      fontSize: 14,
                      fontFamily: "SatoshiMedium",
                    }}
                  >
                    Like them back to start a conversation.
                  </Text>
                </LinearGradient>
              )}

              {/* You Liked Banner */}
              {activeTab === "youLiked" && (
                <LinearGradient
                  colors={["#0EA5E9", "#06B6D4"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 16,
                  }}
                >
                  <Text
                    style={{
                      color: "white",
                      fontSize: 16,
                      fontFamily: "SatoshiBold",
                      marginBottom: 4,
                    }}
                  >
                    🎉 You like {YouLiked.length} people!
                  </Text>
                  <Text
                    style={{
                      color: "white",
                      fontSize: 14,
                      fontFamily: "SatoshiMedium",
                    }}
                  >
                    Stay calm while they like you back.
                  </Text>
                </LinearGradient>
              )}
            </View>

            {/* Card Grid */}
            <FlatList
              data={currentData}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderUserCard}
              numColumns={2}
              contentContainerStyle={{
                paddingHorizontal: 8,
                paddingBottom: 100,
              }}
              showsVerticalScrollIndicator={false}
            />
          </ScrollView>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
