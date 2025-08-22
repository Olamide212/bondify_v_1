import React from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import UserCard from "./userCard";

const YouLiked = ({ data, onUserPress }) => {
  return (
    <View style={styles.tabContent}>
      <LinearGradient
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

export default YouLiked;
