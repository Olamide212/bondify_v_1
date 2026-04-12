import React from "react";
import { View, Text, FlatList, StyleSheet, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import ExploreEmptyState from "./ExploreEmptyState";
import UsersProfileCard from "../ui/UsersProfileCard"; // Update path as needed

const { width } = Dimensions.get("window");

const YouLiked = ({ data, onUserPress }) => {
  const likedByYou = Array.isArray(data) ? data : [];

  return (
    <View style={styles.tabContent}>
      {/* <LinearGradient
        colors={["#0EA5E9", "#06B6D4"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.banner}
      >
        <Text style={styles.bannerTitle}>
          🎉 You like {data.length} people!
        </Text>
        <Text style={styles.bannerSubtitle}>
          Stay calm while they like you back.
        </Text>
      </LinearGradient> */}

      <FlatList
        data={likedByYou}
        keyExtractor={(item) => (item.id || item._id || "").toString()}
        renderItem={({ item }) => (
          <UsersProfileCard
            profile={item}
            onPress={() => onUserPress(item)}
            height={280}
          />
        )}
        numColumns={2}
        contentContainerStyle={[
          styles.listContent,
          likedByYou.length === 0 && styles.emptyListContent,
        ]}
        columnWrapperStyle={likedByYou.length > 0 ? styles.columnWrapper : undefined}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <ExploreEmptyState
            emoji="💖"
            title="You haven’t liked anyone yet"
            subtitle="Profiles you like will appear here so you can keep track of who caught your eye."
          />
        }
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
    fontFamily: "PlusJakartaSansBold",
    marginBottom: 4,
  },
  bannerSubtitle: {
    color: "white",
    fontSize: 14,
    fontFamily: "PlusJakartaSansMedium",
  },
  listContent: {
    flexGrow: 1,
    alignItems: "center",
    paddingBottom: 100,
  },
  emptyListContent: {
    justifyContent: "center",
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
});

export default YouLiked;
