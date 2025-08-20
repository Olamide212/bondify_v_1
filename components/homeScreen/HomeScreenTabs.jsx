import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors } from "../../constant/colors";

const HomeScreenTabs = ({ activeTab, setActiveTab }) => {
  const tabs = ["Around you", "Top picks", "Matchmaker"];

  return (
    <View>
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={styles.tabWrapper}
            onPress={() => setActiveTab(tab)}
          >
            <View
              style={[
                styles.tabButton,
                activeTab === tab && styles.activeTabButton,
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.activeTabText,
                ]}
              >
                {tab}
              </Text>
              {tab === "Matchmaker" && (
                <View style={styles.aiBadge}>
                  <Text style={styles.aiBadgeText}>AI</Text>
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
    elevation: 5, // required for Android
  },

  tabWrapper: {
    flex: 1, // each tab shares equal space
    alignItems: "center",
    alignSelf: "center"
  },
  tabButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 50,
    alignSelf: "center", // makes active tab wrap its content
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
  aiBadge: {
    backgroundColor: "#000",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
  },
  aiBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
});

export default HomeScreenTabs;
