import React, { useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { colors } from "../../constant/colors";

const ExploreScreenTab = ({
  activeTab,
  setActiveTab,
  visitedCount,
  likedCount,
  youLikedCount,
}) => {
  const scrollViewRef = useRef(null);

  const tabs = [
    { key: "visitedYou", label: "Visited You", count: visitedCount },
    { key: "likedYou", label: "Liked You", count: likedCount },
    { key: "youLiked", label: "You Liked", count: youLikedCount },
    { key: "passed", label: "Passed", count: youLikedCount },
    { key: "bondSent", label: "Bond", count: youLikedCount },
  ];

  const handleTabPress = (key, index) => {
    setActiveTab(key);

    // estimate width of each tab (adjust if tabs are wider)
    const tabWidth = 120; // <-- tweak to match your design
    const scrollToX = Math.max(index * tabWidth - tabWidth, 0);

    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: scrollToX,
        animated: true,
      });
    }
  };

  return (
    <ScrollView
      ref={scrollViewRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContainer}
    >
      {tabs.map(({ key, label, count }, index) => (
        <TouchableOpacity
          key={key}
          style={styles.tabWrapper}
          onPress={() => handleTabPress(key, index)}
        >
          <View
            style={[
              styles.tabButton,
              activeTab === key && styles.activeTabButton,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === key && styles.activeTabText,
              ]}
            >
              {label}
            </Text>

            {typeof count === "number" && (
              <View
                style={[styles.badge, activeTab === key && styles.activeBadge]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    activeTab === key && styles.activeBadgeText,
                  ]}
                >
                  {count}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tabWrapper: {
    marginRight: 12,
  },
  tabButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 50,
    backgroundColor: "#f9f9f9",

    // Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  activeTabButton: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 13,
    color: "#888",
    fontFamily: "SatoshiMedium",
  },
  activeTabText: {
    color: "#fff",
    fontFamily: "SatoshiBold",
  },
  badge: {
    backgroundColor: "#eee",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  badgeText: {
    color: "#333",
    fontSize: 11,
    fontFamily: "SatoshiMedium",
  },
  activeBadge: {
    backgroundColor: "#fff",
  },
  activeBadgeText: {
    color: colors.primary,
    fontFamily: "SatoshiBold",
  },
});

export default ExploreScreenTab;
