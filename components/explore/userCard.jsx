import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Star } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");
const CARD_MARGIN = 8;
const CARD_WIDTH = (width - 30) / 2;

const UserCard = ({ user, onPress, isSelectable, isSelected }) => {
  return (
    <TouchableOpacity
      onPress={() => onPress(user.id)}
      style={[styles.cardContainer, { opacity: isSelected ? 0.75 : 1 }]}
    >
      <View style={styles.card}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: user.image }}
            style={styles.cardImage}
            resizeMode="cover"
          />

          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.7)"]}
            style={styles.imageGradient}
          />

          <View style={styles.timeAgoBadge}>
            <Text style={styles.timeAgoText}>{user.timeAgo}</Text>
          </View>

          {user.verified && (
            <View style={styles.verifiedBadge}>
              <Star size={14} color="white" fill="white" />
            </View>
          )}

          {user.isMatch && (
            <View style={styles.matchBadge}>
              <Text style={styles.matchText}>MATCH</Text>
            </View>
          )}

          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {user.name}, {user.age}
            </Text>
            <Text style={styles.userDistance}>{user.distance}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: CARD_WIDTH,
    marginBottom: 16,
    marginHorizontal: CARD_MARGIN / 2,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    elevation: 2,
  },
  imageContainer: {
    position: "relative",
  },
  cardImage: {
    width: "100%",
    height: 220,
  },
  imageGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 100,
  },
  timeAgoBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  timeAgoText: {
    color: "white",
    fontSize: 12,
  },
  verifiedBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#3B82F6",
    padding: 6,
    borderRadius: 20,
  },
  matchBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#FF0066",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  matchText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  userInfo: {
    padding: 12,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  userName: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  userDistance: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
  },
});

export default UserCard;
