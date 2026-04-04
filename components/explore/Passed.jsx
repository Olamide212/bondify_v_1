import React from "react";
import { View, Text, FlatList, StyleSheet, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import UsersProfileCard from "../ui/UsersProfileCard";

const { width } = Dimensions.get("window");

const Passed = ({ data, onUserPress }) => {
  return (
    <View style={styles.tabContent}>
      <LinearGradient
        colors={["#6B7280", "#9CA3AF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.banner}
      >
        <Text style={styles.bannerTitle}>
          👋 You passed on {data.length} people
        </Text>
        <Text style={styles.bannerSubtitle}>
          You can revisit profiles you previously passed on.
        </Text>
      </LinearGradient>

      <FlatList
        data={data}
        keyExtractor={(item) => (item.id || item._id || "").toString()}
        renderItem={({ item }) => (
          <UsersProfileCard
            profile={item}
            onPress={() => onUserPress(item)}
            height={270}
          />
        )}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  tabContent: {
    flex: 1,
    padding: 16,
  },
  banner: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  bannerTitle: {
    color: "white",
    fontSize: 16,
    fontFamily: "OutfitBold",
    marginBottom: 4,
  },
  bannerSubtitle: {
    color: "white",
    fontSize: 14,
    fontFamily: "OutfitMedium",
  },
  listContent: {
    alignItems: "center",
    paddingBottom: 100,
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
});

export default Passed;
