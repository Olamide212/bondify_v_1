/**
 * Unmatched Users Screen  —  app/(root)/unmatched-users/index.jsx
 *
 * Lists all users the current user has unmatched with.
 * Tapping a user opens their old chat with a rematch option.
 * Accessible from the chat header's UserX (unmatch) icon.
 */

import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { ArrowLeft, RefreshCw, User } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { colors } from "../../../constant/colors";
import { matchService } from "../../../services/matchService";

export default function UnmatchedUsersScreen() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUserId = useSelector(
    (state) => state.auth.user?.id || state.auth.user?._id
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      const data = await matchService.getUnmatchedUsers();
      if (mounted) {
        setUsers(data);
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleOpenChat = (item) => {
    const hasRematchPending = !!item.rematchRequestedBy;
    const rematchRequestedByMe =
      hasRematchPending && String(item.rematchRequestedBy) === String(currentUserId);

    router.push({
      pathname: "/chat-screen",
      params: {
        matchId:      String(item.matchId),
        userId:       String(item.user?._id),
        name:         item.user?.name ?? "Unknown",
        profileImage: item.user?.profileImage ?? "",
        isOnline:     "false",
        isVerified:   String(item.user?.verified ?? false),
        isUnmatched:  "true",
        rematchRequestedByMe: String(rematchRequestedByMe),
      },
    });
  };

  const renderItem = ({ item }) => {
    const hasRematchPending = !!item.rematchRequestedBy;
    const rematchRequestedByMe =
      hasRematchPending && String(item.rematchRequestedBy) === String(currentUserId);

    return (
      <TouchableOpacity
        style={styles.row}
        activeOpacity={0.7}
        onPress={() => handleOpenChat(item)}
      >
        {item.user?.profileImage ? (
          <Image
            source={{ uri: item.user.profileImage }}
            style={styles.avatar}
            cachePolicy="memory-disk"
            transition={200}
            placeholder={require("../../../assets/images/user.png")}
          />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <User size={20} color="#94A3B8" />
          </View>
        )}
        <View style={styles.info}>
          <Text style={styles.name}>{item.user?.name ?? "Unknown"}</Text>
          {hasRematchPending ? (
            <View style={styles.rematchBadge}>
              <RefreshCw size={11} color={colors.primary} />
              <Text style={styles.rematchBadgeText}>
                {rematchRequestedByMe ? "Rematch sent" : "Wants to rematch"}
              </Text>
            </View>
          ) : item.unmatchedAt ? (
            <Text style={styles.date}>
              Unmatched {new Date(item.unmatchedAt).toLocaleDateString()}
            </Text>
          ) : null}
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Unmatched Users</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : users.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No unmatched users yet.</Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => String(item.matchId)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingVertical: 10 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.whiteLight,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "OutfitBold",
    color: '#E5E5E5',
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 15,
    color: "#9CA3AF",
    fontFamily: "Outfit",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.whiteLight,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarFallback: {
    backgroundColor: '#1E1E1E',
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.whiteLight,
  },
  info: { flex: 1 },
  name: {
    fontSize: 15,
    fontFamily: "OutfitMedium",
    color: '#E5E5E5',
  },
  date: {
    fontSize: 12,
    fontFamily: "Outfit",
    color: "#9CA3AF",
    marginTop: 2,
  },
  rematchBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  rematchBadgeText: {
    fontSize: 12,
    fontFamily: "OutfitMedium",
    color: colors.primary,
  },
  chevron: {
    fontSize: 22,
    color: "#D1D5DB",
    fontWeight: "300",
  },
});
