import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const ExploreScreenTab = ({
  activeTab,
  setActiveTab,
  visitedCount,
  likedCount,
  youLikedCount,
  passedCount,
}) => {
  const tabs = [
    { key: "visitedYou", label: "Visited You", count: visitedCount },
    { key: "likedYou", label: "Liked You", count: likedCount },
    { key: "youLiked", label: "You Liked", count: youLikedCount },
    { key: "passed", label: "Passed", count: passedCount },
  ];

  return (
    <View style={styles.tabBarWrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabBarContent}
      >
        {tabs.map(({ key, label, count }) => {
          const isActive = activeTab === key;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.tabItem, isActive && styles.tabItemActive]}
              onPress={() => setActiveTab(key)}
            >
              <Text
                style={[
                  styles.tabLabel,
                  isActive ? styles.tabLabelActive : styles.tabLabelInactive,
                ]}
              >
                {label}
                {typeof count === "number" ? ` (${count})` : ""}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBarWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  tabBarContent: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 24,
  },
  tabItem: {
    paddingVertical: 12,
  },
  tabItemActive: {
    borderBottomWidth: 2,
    borderBottomColor: "#111",
  },
  tabLabel: {
    fontSize: 13,
    fontFamily: "PlusJakartaSansBold",
    whiteSpace: "nowrap",
  },
  tabLabelActive: {
    color: "#111",
  },
  tabLabelInactive: {
    color: "#9CA3AF",
  },
});

export default ExploreScreenTab;
