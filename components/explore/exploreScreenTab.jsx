import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors } from "../../constant/colors";

const ExploreScreenTab = ({
  activeTab,
  setActiveTab,
  visitedCount,
  likedCount,
  youLikedCount,
}) => {
  // map tabs with their counts
  const tabs = [
    { key: "visitedYou", label: "Visited You", count: visitedCount },
    { key: "likedYou", label: "Liked You", count: likedCount },
    { key: "youLiked", label: "You Liked", count: youLikedCount },
  ];

  return (
    <View>
      <View style={styles.tabsContainer}>
        {tabs.map(({ key, label, count }) => (
          <TouchableOpacity
            key={key}
            style={styles.tabWrapper}
            onPress={() => setActiveTab(key)}
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

              {/* badge */}
              {typeof count === "number" && (
                <View
                  style={[
                    styles.badge,
                    activeTab === key && styles.activeBadge,
                  ]}
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
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tabsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#fff",
    marginHorizontal: 20,
    borderRadius: 100,
    alignSelf: "center",

    // Drop shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },

  tabWrapper: {
    flex: 1,
    alignItems: "center",
  },
  tabButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 50,
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
