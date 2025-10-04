import React from "react";
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Cross,
  Star,
  Home,
  Clock,
  Heart,
  Users,
  Moon,
} from "lucide-react-native";
import GeneralHeader from "../../../../components/headers/GeneralHeader";

const { width } = Dimensions.get("window");
const CARD_MARGIN = 14;
const CARD_WIDTH = (width - CARD_MARGIN * 3) / 2;
const CARD_HEIGHT = 260;

const DiscoverScreen = () => {
  const router = useRouter();

  // Define discover categories with type grouping and descriptions
  const discoverCategories = [
    {
      type: "Religion dating preferences",
      description:
        "Connect with people who share your faith and spiritual values",
      data: [
        {
          id: "1",
          name: "Christian searching for Love",
          members: "12.4k",
          icon: "Cross",
          preference: "Christian searching for Love",
          color: "#371f7d",
          lightColor: "#EDE7F6",
          border: "#6A1B9A",
        },
        {
          id: "2",
          name: "Muslim searching for Love",
          members: "8.7k",
          icon: "Star",
          preference: "muslim searching for love",
          color: "#00695C",
          lightColor: "#E0F2F1",
          border: "#00695C",
        },
        {
          id: "3",
          name: "Traditionalist searching for Love",
          members: "6.2k",
          icon: "Home",
          preference: "Traditionalist searching for love",
          color: "#B71C1C",
          lightColor: "#FFEBEE",
        },
      ],
    },
    {
      type: "Relationship Type",
      description:
        "Find connections based on your relationship goals and intentions",
      data: [
        {
          id: "4",
          name: "Something casual",
          members: "15.2k",
          icon: "Clock",
          preference: "Short-term fun",
          color: "#FF5722",
          lightColor: "#FFF3E0",
        },
        {
          id: "5",
          name: "Long-term relationship",
          members: "20.1k",
          icon: "Heart",
          preference: "Long-term relationship",
          color: "#388E3C",
          lightColor: "#E8F5E9",
        },
      ],
    },
  ];

  const navigateToCategory = (category) => {
    router.push({
      pathname: "/discover-profile",
      params: {
        preference: category.preference,
        title: category.name,
      },
    });
  };

  const renderIcon = (iconName, color) => {
    switch (iconName) {
      case "Cross":
        return <Cross size={28} color={color} />;
      case "Star":
        return <Moon size={28} color={color} />;
      case "Home":
        return <Home size={28} color={color} />;
      case "Clock":
        return <Clock size={28} color={color} />;
      case "Heart":
        return <Heart size={28} color={color} />;
      default:
        return <Heart size={28} color={color} />;
    }
  };

  const DiscoverCard = ({ category, onPress, fullWidth = false }) => {
    return (
      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor: category.lightColor },
          fullWidth && styles.fullWidthCard,
        ]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={styles.cardContent}>
          {/* Centered icon and category name */}
          <View style={styles.centeredContent}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: category.color },
              ]}
            >
              {renderIcon(category.icon, "#fff")}
            </View>
            <Text
              style={[styles.categoryName, { color: category.color }]}
              className="font-SatoshiBold"
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {category.name}
            </Text>
          </View>

          {/* Member count in bottom-right corner */}
          <View
            style={[
              styles.memberContainer,
              { backgroundColor: category.color },
            ]}
          >
            <Users size={14} color="white" fill="white" />
            <Text style={styles.memberCount} className="font-SatoshiBold">
              {category.members}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <GeneralHeader title="Discover" />

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 15 }}
        showsVerticalScrollIndicator={false}
      >
        {discoverCategories.map((section, index) => {
          const isOddNumberOfItems = section.data.length % 2 !== 0;

          return (
            <View key={index} style={styles.section}>
              <Text style={styles.sectionTitle} className="font-SatoshiBold">
                {section.type}
              </Text>
              <Text style={styles.sectionDescription} className="font-Satoshi">
                {section.description}
              </Text>
              <View style={styles.grid}>
                {section.data.map((item, itemIndex) => {
                  const isLastItem = itemIndex === section.data.length - 1;
                  const shouldBeFullWidth = isOddNumberOfItems && isLastItem;

                  return (
                    <DiscoverCard
                      key={item.id}
                      category={item}
                      onPress={() => navigateToCategory(item)}
                      fullWidth={shouldBeFullWidth}
                    />
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    marginBottom: 3,
    paddingLeft: 4,
  },
  sectionDescription: {
    fontSize: 16,
    marginBottom: 16,
    lineHeight: 20,
    paddingLeft: 4,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    marginBottom: CARD_MARGIN,
  },
  fullWidthCard: {
    width: "100%",
  },
  cardContent: {
    flex: 1,
    padding: 16,
  },
  centeredContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  categoryName: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 18,
  },
  memberContainer: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    position: "absolute",
    bottom: 16,
    right: 16,
  },
  memberCount: {
    fontSize: 12,
    marginLeft: 4,
    color: "white",
  },
});

export default DiscoverScreen;
