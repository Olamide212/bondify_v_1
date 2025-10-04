import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import {
  ChevronRight,
  Cross,
  Star,
  Home,
  Clock,
  Heart,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

// Icon mapping for each category
const categoryIcons = {
  "Christian searching for Love": Cross,
  "Muslim searching for love": Star,
  "Traditionalist searching for love": Home,
  "Short-term fun": Clock,
  "Long-term relationship": Heart,
};

// Gradient colors for each category
const categoryGradients = {
  "Christian searching for Love": ["#6A1B9A", "#4A148C"], // Purple
  "Muslim searching for love": ["#00695C", "#004D40"], // Teal
  "Traditionalist searching for love": ["#B71C1C", "#880E4F"], // Red to pink
  "Short-term fun": ["#FF5722", "#E64A19"], // Orange
  "Long-term relationship": ["#388E3C", "#1B5E20"], // Green
};

const DiscoverCard = ({ category, onPress }) => {
  const IconComponent = categoryIcons[category.name] || Cross;
  const gradientColors = categoryGradients[category.name] || [
    "#6A1B9A",
    "#4A148C",
  ];

  return (
    <TouchableOpacity
      style={styles.cardContainer}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={gradientColors}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <IconComponent size={28} color="#fff" />
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.categoryName} className="font-SatoshiMedium">
              {category.name}
            </Text>
          </View>

          <ChevronRight size={20} color="#fff" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 16,
    marginBottom: 16,

  },
  gradientBackground: {
    padding: 20,
    minHeight: 100,
    justifyContent: "center",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "600",
  },
});

export default DiscoverCard;
