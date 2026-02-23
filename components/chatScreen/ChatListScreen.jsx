import {
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../constant/colors";
import { formatRelativeDate } from "../../utils/helper";
import GeneralHeader from "../headers/GeneralHeader";

const ChatListScreen = ({ users, onSelectUser }) => {
  const newMatches = users.filter((user) => !user.hasChatted);
  const placeholderSlots = Array.from({ length: 5 }, (_, index) => ({
    id: `placeholder-${index}`,
  }));

  return (
    <SafeAreaView style={styles.listContainer}>
      <GeneralHeader
        title="Your messages"
        className="text-black"
      />
      {/* Horizontal Scroll of New Matches */}
      <Text className="text-black font-SatoshiBold pl-5 pb-2 text-lg pt-2">
        New Matches
      </Text>
      <View style={styles.newMatchesWrapper}>
        <FlatList
          data={placeholderSlots}
          horizontal
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingLeft: 16, paddingRight: 8 }}
          renderItem={({ index }) => {
            const match = newMatches[index];

            if (match) {
              return (
                <TouchableOpacity
                  style={styles.newMatchItem}
                  onPress={() => onSelectUser(match)}
                >
                  <Image
                    source={{ uri: match.profileImage }}
                    style={styles.newMatchImage}
                  />
                  <Text
                    style={styles.newMatchName}
                    numberOfLines={1}
                    className="font-SatoshiBold capitalize"
                  >
                    {match.name}
                  </Text>
                </TouchableOpacity>
              );
            }

            return (
              <View style={styles.newMatchItem}>
                <View style={styles.placeholderCircle} />
                <Text style={styles.placeholderLabel}>Waiting</Text>
              </View>
            );
          }}
        />
      </View>

      <View className="bg-white flex-1 rounded-t-3xl pt-3">
        <Text className="pl-5 pt-4 font-SatoshiBold text-lg">Active chats</Text>
        {users.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateTitle}>No conversations yet</Text>
            <Text style={styles.emptyStateSubtitle}>
              Your matches and chats will appear here.
            </Text>
          </View>
        ) : (
          <FlatList
            data={users}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.matchItem}
                onPress={() => onSelectUser(item)}
              >
                <View style={styles.profileContainer}>
                  <Image
                    source={{ uri: item.profileImage }}
                    style={styles.profileImage}
                  />
                  {item.isOnline && <View style={styles.onlineIndicator} />}
                </View>

                <View style={styles.matchInfo}>
                  <Text style={styles.matchName} className='capitalize'>{item.name}</Text>
                  <Text
                    style={styles.matchMessage}
                    numberOfLines={1}
                    className="font-Satoshi"
                  >
                    {item.lastMessage || "No messages yet"}
                  </Text>
                </View>

                <View style={styles.matchMeta}>
                  <Text style={styles.matchTime}>
                    {formatRelativeDate(item.matchedDate)}
                  </Text>
                  {item.unread > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{item.unread}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
      {/* Chat List */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    flex: 1,
    backgroundColor: "#fff",

  },

  listTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111",
  },
  newMatchesWrapper: {
    paddingBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  newMatchItem: {
    marginRight: 25,
    alignItems: "center",
    width: 72,
  },
  newMatchImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#E5E7EB",
  },
  placeholderCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#000",
    backgroundColor: "transparent",
  },
  placeholderLabel: {
    fontSize: 11,
    color: "#000",
    marginTop: 6,
    textAlign: "center",
  },
  newMatchName: {
    fontSize: 12,
    color: "#000",
    marginTop: 4,
    textAlign: "center",

  },
  matchItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  profileContainer: {
    position: "relative",
    marginRight: 12,
  },
  profileImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: "#fff",
  },
  matchInfo: {
    flex: 1,
    justifyContent: "center",
  },
  matchName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  matchMessage: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  matchMeta: {
    alignItems: "flex-end",
  },
  matchTime: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  unreadBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },
  unreadText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  summaryCard: {
    width: 80,
    height: 80,

    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 20,
  },
  summaryCount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#EC4899",
  },
  summaryLabel: {
    fontSize: 12,
    textAlign: "center",
    color: "#6B7280",
    marginTop: 4,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  emptyStateTitle: {
    fontSize: 20,
    color: "#111",
    fontWeight: "700",
    marginBottom: 6,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
});

export default ChatListScreen;
