import { FlatList, StyleSheet, View } from "react-native";
import ExploreEmptyState from "./ExploreEmptyState";
import UsersProfileCard from "../ui/UsersProfileCard"; // Update path as needed


const LikedYou = ({ data, onUserPress, selectedUsers }) => {
  const likedUsers = Array.isArray(data) ? data : [];
  const selectedUserIds = Array.isArray(selectedUsers) ? selectedUsers : [];

  return (
    <View style={styles.tabContent}>
      {/* <LinearGradient
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
      </LinearGradient> */}

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
        contentContainerStyle={[
          styles.listContent,
          likedUsers.length === 0 && styles.emptyListContent,
        ]}
        columnWrapperStyle={likedUsers.length > 0 ? styles.columnWrapper : undefined}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <ExploreEmptyState
            emoji="💘"
            title="No likes yet"
            subtitle="When people like your profile, they will appear here so you can like them back."
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
    fontWeight: "bold",
    marginBottom: 4,
  },
  bannerSubtitle: {
    color: "white",
    fontSize: 14,
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

export default LikedYou;
