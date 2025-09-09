import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
} from "react-native";
import { ChevronRight, Users } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

// Image URLs for each category (you can replace these with your own images)
const categoryImages = {
  "Christian searching for Love":
    "https://images.unsplash.com/photo-1513326738677-b964603b136d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80",
  "Muslim searching for love":
    "https://images.unsplash.com/photo-1568609319037-f297ae5b2a00?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80",
  "Traditionalist searching for love":
    "https://images.unsplash.com/photo-1559687671-ecc6c200a5d0?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80",
  "Short-term fun":
    "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80",
  "Long-term relationship":
    "https://images.unsplash.com/photo-1519699047748-de8e457a634e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80",
};

// Gradient overlays for each category
const categoryGradients = {
  "Christian searching for Love": [
    "rgba(106, 27, 154, 0.8)",
    "rgba(49, 27, 146, 0.8)",
  ], // Purple to dark blue
  "Muslim searching for love": [
    "rgba(0, 105, 92, 0.8)",
    "rgba(0, 77, 64, 0.8)",
  ], // Teal to dark teal
  "Traditionalist searching for love": [
    "rgba(183, 28, 28, 0.8)",
    "rgba(136, 14, 79, 0.8)",
  ], // Red to pink
  "Short-term fun": ["rgba(245, 124, 0, 0.8)", "rgba(230, 74, 25, 0.8)"], // Orange to red-orange
  "Long-term relationship": ["rgba(56, 142, 60, 0.8)", "rgba(27, 94, 32, 0.8)"], // Green to dark green
};

const DiscoverCard = ({ category, onPress, backgroundColor }) => {
  const imageUri =
    categoryImages[category.name] ||
    "https://images.unsplash.com/photo-15166462551107-fcefa3c6c9f7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80";
  const gradientColors = categoryGradients[category.name] || [
    "rgba(0, 0, 0, 0.7)",
    "rgba(0, 0, 0, 0.5)",
  ];

  return (
    <TouchableOpacity
      style={styles.cardContainer}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <ImageBackground
        source={{ uri: imageUri }}
        style={styles.imageBackground}
        imageStyle={styles.imageStyle}
      >
        <LinearGradient
          colors={gradientColors}
          style={styles.gradientOverlay}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Header Row */}
          <View style={styles.headerRow}>
            <View style={styles.textContainer}>
              <Text style={styles.categoryName} className="font-SatoshiMedium">
                {category.name}
              </Text>
            </View>

            <ChevronRight size={20} color="#fff" />
          </View>

          {/* Description */}
          <Text
            style={styles.categoryDescription}
            className="font-Satoshi text-xl"
          >
            {category.description}
          </Text>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.memberInfo} className=''>
              <Users size={14} color="#fff" />
              <Text
                style={styles.categoryMembers}
                className="font-SatoshiMedium"
              >
                {category.members}
              </Text>
            </View>
            <View>
              <Text
                style={styles.activityText}
                className="font-SatoshiMedium text-lg"
              >
                {category.recentActivity}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    overflow: "hidden",
  },
  imageBackground: {
    width: "100%",
    height: 180, // Fixed height for all cards
  },
  imageStyle: {
    borderRadius: 16,
  },
  gradientOverlay: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    justifyContent: "space-between",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.5)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  categoryIcon: {
    fontSize: 22,
  },
  textContainer: {
    flex: 1,
  },
  categoryName: {
    fontSize: 24,
    color: "#fff",
    marginBottom: 2,
  },
  memberInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryMembers: {
    fontSize: 13,
    color: "#fff",
    marginLeft: 4,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  categoryDescription: {
    color: "#fff",
    lineHeight: 20,
    marginBottom: 12,
    
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.3)",
    paddingTop: 8,
  },
  activityText: {
    fontSize: 13,
    color: "#fff",
    fontWeight: "500",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default DiscoverCard;
