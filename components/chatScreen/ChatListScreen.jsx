import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";
import { MoreVertical } from "lucide-react-native";
import { formatRelativeDate } from "../../utils/helper";
import { colors } from "../../constant/colors";
import GeneralHeader from "../headers/GeneralHeader";
import { EllipsisVertical, Shield } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ChatListScreen = ({ users, onSelectUser }) => {
  const newMatches = users.filter((user) => !user.hasChatted); 

  return (
    <SafeAreaView style={styles.listContainer}>
      <GeneralHeader
        title="Messages"
        icon=<Shield color="#fff" fill="#fff" />
        className="text-white"
      />
      {/* Horizontal Scroll of New Matches */}
      <Text className="text-white font-SatoshiBold pl-5 pb-2 text-lg pt-2">
        New Matches
      </Text>
      {newMatches.length > 0 && (
        <View style={styles.newMatchesWrapper} className="">
          <FlatList
            data={[{ id: "summary" }, ...newMatches]}
            horizontal
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingLeft: 16 }}
            renderItem={({ item, index }) => {
              if (item.id === "summary") {
                return (
                  <View className="bg-secondary mr-5 w-28 justify-center items-center rounded-lg">
                    <Text className="text-white font-SatoshiBold text-3xl ">
                      {newMatches.length}
                    </Text>
                    <Text className="text-center text-white font-SatoshiBold">
                      New{"\n"}Matches
                    </Text>
                  </View>
                );
              }

              return (
                <TouchableOpacity
                  style={styles.newMatchItem}
                  onPress={() => onSelectUser(item)}
                >
                  <Image
                    source={{ uri: item.profileImage }}
                    style={styles.newMatchImage}
                  />
                  <Text
                    style={styles.newMatchName}
                    numberOfLines={1}
                    className="font-SatoshiBold"
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      )}

      <View className="bg-white flex-1 rounded-t-3xl pt-3">
        <Text className="pl-5 pt-4 font-SatoshiBold text-lg">Active chats</Text>
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
                <Text style={styles.matchName}>{item.name}</Text>
                <Text
                  style={styles.matchMessage}
                  numberOfLines={1}
                  className="font-Satoshi"
                >
                  {item.lastMessage}
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
      </View>
      {/* Chat List */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    flex: 1,
    backgroundColor: colors.primary,

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
    width: 64,
  },
  newMatchImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: "#E5E7EB",
  },
  newMatchName: {
    fontSize: 12,
    color: "#fff",
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
});

export default ChatListScreen;
