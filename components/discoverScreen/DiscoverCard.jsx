import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import {
  Cross,
  Star,
  Home,
  Clock,
  Heart,
  Users,
  Moon,
} from "lucide-react-native";

const { width } = Dimensions.get("window");
const CARD_MARGIN = 16;
const CARD_WIDTH = width - CARD_MARGIN * 2;
const FRONT_CARD_HEIGHT = 170;
const BACK_CARD_HEIGHT = 210;

const renderIcon = (iconName, color) => {
  switch (iconName) {
    case "Cross":
      return <Cross size={20} color={color} />;
    case "Star":
      return <Moon size={20} color={color} />;
    case "Home":
      return <Home size={20} color={color} />;
    case "Clock":
      return <Clock size={20} color={color} />;
    case "Heart":
      return <Heart size={20} color={color} />;
    default:
      return <Heart size={20} color={color} />;
  }
};

const DiscoverCard = ({ category, onPress }) => {
  const color = category.color || "#FF4D4D";

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={styles.wrapper}
    >
      {/* BACK COLORED CARD */}
      <View style={[styles.backCard, { backgroundColor: `${color}` }]}>
        <View style={styles.memberRow}>
          <Users size={13} color="#fff" />
          <Text style={styles.memberText}>{category.members}</Text>
        </View>
      </View>

      {/* FRONT WHITE CARD */}
      <View style={[styles.frontCard, { shadowColor: color }]}>
        {/* Corner Accent 
        <View style={[styles.cornerAccent, { backgroundColor: color }]}>
          <View style={styles.cornerIcon}>
            {renderIcon(category.icon, "#fff")}
          </View>
        </View>*/}

        {/* Text Content */}
        <View style={styles.textSection}>
          <Text style={styles.title}>{category.name}</Text>
          <Text style={styles.subtitle}>
            {category.description ||
              "Connect with singles sharing your values and goals"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: CARD_WIDTH,
    alignSelf: "center",
    marginVertical: 10,
  },

  // BACK CARD (COLORED)
  backCard: {
    height: BACK_CARD_HEIGHT,
    borderRadius: 22,
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  memberText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },

  // FRONT CARD (WHITE)
  frontCard: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: FRONT_CARD_HEIGHT,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.19,
    shadowRadius: 8,
    elevation: 6,
  },

  // Corner accent
  cornerAccent: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 80,
    height: 80,
    borderBottomLeftRadius: 80,
    justifyContent: "flex-start",
    alignItems: "flex-end",
    padding: 10,
  },
  cornerIcon: {
    marginTop: 8,
    marginRight: 8,
  },

  // Text
  textSection: {
    marginTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
  },
  subtitle: {
    fontSize: 14,
    color: "#444",
    marginTop: 6,
    lineHeight: 20,
  },
});

export default DiscoverCard;
