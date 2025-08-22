import React from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import UserCard from "./userCard";

const VisitedYou = ({ data, onUserPress }) => {
  return (
    <View style={styles.tabContent}>
      <LinearGradient
        colors={["#4F46E5", "#7C3AED"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.banner}
      >
        <Text style={styles.bannerTitle}>
          👀 {data.length} people visited your profile!
        </Text>
        <Text style={styles.bannerSubtitle}>
          Check out who's interested in you.
        </Text>
      </LinearGradient>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <UserCard user={item} onPress={onUserPress} />
        )}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  tabContent: {
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
    fontFamily: "SatoshiBold",
    marginBottom: 4,
  },
  bannerSubtitle: {
    color: "white",
    fontSize: 14,
    fontFamily: "SatoshiMedium",
  },
  listContent: {
    paddingHorizontal: 8,
    paddingBottom: 100,
  },
});

export default VisitedYou;
