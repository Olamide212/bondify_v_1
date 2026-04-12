import React from "react";
import { View, Text, FlatList, StyleSheet, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import ExploreEmptyState from "./ExploreEmptyState";
import UsersProfileCard from "../ui/UsersProfileCard";

const { width } = Dimensions.get("window");

const Passed = ({ data, onUserPress }) => {
  const passedUsers = Array.isArray(data) ? data : [];

  return (
    <View style={styles.tabContent}>
      {/* <LinearGradient
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
      </LinearGradient> */}

      <FlatList
        data={passedUsers}
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
          passedUsers.length === 0 && styles.emptyListContent,
        ]}
        columnWrapperStyle={passedUsers.length > 0 ? styles.columnWrapper : undefined}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <ExploreEmptyState
            emoji="👋"
            title="No passed profiles"
            subtitle="Profiles you pass on will show up here in case you want to revisit them later."
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

export default Passed;
