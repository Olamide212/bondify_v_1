import { LinearGradient } from "expo-linear-gradient";
import { FlatList, StyleSheet, Text, View } from "react-native";
import UsersProfileCard from "../ui/UsersProfileCard"; // Update path as needed


const LikedYou = ({ data, onUserPress, selectedUsers }) => {
  const likedUsers = Array.isArray(data) ? data : [];
  const selectedUserIds = Array.isArray(selectedUsers) ? selectedUsers : [];

  return (
    <View style={styles.tabContent}>
      <LinearGradient
        colors={["#FD465C", "#A80EC1"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.banner}
      >
        <Text style={styles.bannerTitle}>
          💕 {likedUsers.length} people like you!
        </Text>
        <Text style={styles.bannerSubtitle}>
          Like them back to start a conversation.
        </Text>
      </LinearGradient>

      <FlatList
        data={likedUsers}
        keyExtractor={(item) => (item.id || item._id || "").toString()}
        renderItem={({ item }) => (
          <UsersProfileCard
            profile={item}
            onPress={() => onUserPress(item)}
            height={270}
            isSelectable={true}
            isSelected={selectedUserIds.includes(item.id || item._id)}
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
    fontWeight: "bold",
    marginBottom: 4,
  },
  bannerSubtitle: {
    color: "white",
    fontSize: 14,
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

export default LikedYou;
