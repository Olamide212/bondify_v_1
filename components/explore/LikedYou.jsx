import React from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import UserCard from "./userCard";

const LikedYou = ({ data, onUserPress, selectedUsers }) => {
  return (
    <View style={styles.tabContent}>
      <LinearGradient
        colors={["#FD465C", "#A80EC1"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.banner}
      >
        <Text style={styles.bannerTitle}>
          💕 {data.length} people like you!
        </Text>
        <Text style={styles.bannerSubtitle}>
          Like them back to start a conversation.
        </Text>
      </LinearGradient>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <UserCard
            user={item}
            onPress={onUserPress}
            isSelectable={true}
            isSelected={selectedUsers.includes(item.id)}
          />
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

export default LikedYou;
