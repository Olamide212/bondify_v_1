import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { UserX } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../../constant/colors";
import SettingsService from "../../../services/settingsService";

const PRIMARY       = colors.primary;
const PRIMARY_LIGHT = colors.primaryLight;

// ── Helpers ───────────────────────────────────────────────────
const getInitials = (name = "") =>
  name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

// ── Single blocked user row ───────────────────────────────────
const BlockedUserRow = ({ item, onUnblock, isUnblocking }) => (
  <View style={styles.row}>
    {/* Avatar */}
    {item.profilePhoto ? (
      <Image source={{ uri: item.profilePhoto }} style={styles.avatar} />
    ) : (
      <View style={styles.avatarPlaceholder}>
        <Text style={styles.avatarInitials}>{getInitials(item.name)}</Text>
      </View>
    )}

    {/* Info */}
    <View style={styles.rowInfo}>
      <Text style={styles.rowName} numberOfLines={1}>
        {item.name ?? "Unknown User"}
      </Text>
      {item.blockedAt && (
        <Text style={styles.rowMeta}>
          Blocked{" "}
          {new Date(item.blockedAt).toLocaleDateString([], {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </Text>
      )}
    </View>

    {/* Unblock button */}
    <Pressable
      style={({ pressed }) => [
        styles.unblockBtn,
        pressed && styles.unblockBtnPressed,
        isUnblocking && styles.unblockBtnDisabled,
      ]}
      onPress={() => onUnblock(item)}
      disabled={isUnblocking}
    >
      {isUnblocking ? (
        <ActivityIndicator size="small" color={PRIMARY} />
      ) : (
        <Text style={styles.unblockBtnText}>Unblock</Text>
      )}
    </Pressable>
  </View>
);

// ── Empty state ───────────────────────────────────────────────
const EmptyState = () => (
  <View style={styles.emptyContainer}>
    <View style={styles.emptyIconWrap}>
      <UserX size={36} color={PRIMARY} />
    </View>
    <Text style={styles.emptyTitle}>No blocked users</Text>
    <Text style={styles.emptySubtitle}>
      People you block won&apos;t be able to see your profile or send you messages.
    </Text>
  </View>
);

// ── Main Screen ───────────────────────────────────────────────
const BlockedUsersScreen = () => {
  const router = useRouter();

  const [blockedUsers,   setBlockedUsers]   = useState([]);
  const [isLoading,      setIsLoading]      = useState(true);
  const [isRefreshing,   setIsRefreshing]   = useState(false);
  const [isLoadingMore,  setIsLoadingMore]  = useState(false);
  const [unblockingId,   setUnblockingId]   = useState(null); // userId being unblocked
  const [fetchError,     setFetchError]     = useState(null);
  const [page,           setPage]           = useState(1);
  const [hasMore,        setHasMore]        = useState(false);

  // ── Fetch blocked users ───────────────────────────────────────
  const fetchBlockedUsers = useCallback(async (pageNum = 1, refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else if (pageNum === 1) setIsLoading(true);
    else setIsLoadingMore(true);

    setFetchError(null);

    try {
      const response = await SettingsService.getBlockedUsers({ page: pageNum, limit: 20 });
      // response.data = { blockedUsers: [...], pagination: { page, totalPages, hasMore } }
      const fetched    = response?.data?.blockedUsers ?? [];
      const pagination = response?.data?.pagination   ?? {};

      setHasMore(Boolean(pagination.hasMore));
      setPage(pageNum);

      if (pageNum === 1) {
        setBlockedUsers(fetched);
      } else {
        setBlockedUsers((prev) => [...prev, ...fetched]);
      }
    } catch (err) {
      setFetchError("Couldn't load blocked users. Pull down to retry.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchBlockedUsers(1);
  }, [fetchBlockedUsers]);

  // ── Unblock ───────────────────────────────────────────────────
  const handleUnblock = (item) => {
    Alert.alert(
      "Unblock User",
      `Unblock ${item.name ?? "this user"}? They will be able to see your profile and message you again.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unblock",
          onPress: async () => {
            setUnblockingId(item.userId ?? item._id);
            try {
              await SettingsService.unblockUser(item.userId ?? item._id);
              // Remove from local list immediately
              setBlockedUsers((prev) =>
                prev.filter((u) => (u.userId ?? u._id) !== (item.userId ?? item._id))
              );
            } catch (err) {
              Alert.alert(
                "Error",
                err?.response?.data?.message || err?.message || "Failed to unblock. Please try again."
              );
            } finally {
              setUnblockingId(null);
            }
          },
        },
      ]
    );
  };

  // ── Load more on scroll end ───────────────────────────────────
  const handleLoadMore = () => {
    if (!hasMore || isLoadingMore || isLoading) return;
    fetchBlockedUsers(page + 1);
  };

  // ── Render ────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </Pressable>
        <Text style={styles.headerTitle}>Blocked Users</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Body */}
      {isLoading ? (
        <View style={styles.centeredLoader}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      ) : fetchError ? (
        <Pressable style={styles.errorContainer} onPress={() => fetchBlockedUsers(1)}>
          <Ionicons name="alert-circle-outline" size={40} color="#FCA5A5" />
          <Text style={styles.errorText}>{fetchError}</Text>
          <Text style={styles.retryText}>Tap to retry</Text>
        </Pressable>
      ) : (
        <FlatList
          data={blockedUsers}
          keyExtractor={(item) => String(item.userId ?? item._id)}
          renderItem={({ item }) => (
            <BlockedUserRow
              item={item}
              onUnblock={handleUnblock}
              isUnblocking={unblockingId === (item.userId ?? item._id)}
            />
          )}
          ListEmptyComponent={<EmptyState />}
          ListHeaderComponent={
            blockedUsers.length > 0 ? (
              <Text style={styles.listHeader}>
                {blockedUsers.length} blocked {blockedUsers.length === 1 ? "person" : "people"}
              </Text>
            ) : null
          }
          ListFooterComponent={
            isLoadingMore ? (
              <View style={styles.loadMoreIndicator}>
                <ActivityIndicator size="small" color={PRIMARY} />
              </View>
            ) : null
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={[
            styles.listContent,
            blockedUsers.length === 0 && styles.listContentEmpty,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => fetchBlockedUsers(1, true)}
              tintColor={PRIMARY}
              colors={[PRIMARY]}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "PlusJakartaSansBold",
    color: "#111",
  },

  // Loaders / errors
  centeredLoader:   { flex: 1, alignItems: "center", justifyContent: "center" },
  errorContainer:   { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 32 },
  errorText:        { fontSize: 14, fontFamily: "PlusJakartaSans", color: "#666", textAlign: "center" },
  retryText:        { fontSize: 13, fontFamily: "PlusJakartaSansMedium", color: PRIMARY },

  // List
  listContent:      { paddingBottom: 32 },
  listContentEmpty: { flex: 1 },
  listHeader:       { fontSize: 12, fontFamily: "PlusJakartaSansMedium", color: "#aaa", paddingHorizontal: 20, paddingVertical: 12, letterSpacing: 0.4 },
  separator:        { height: 1, backgroundColor: "#f2f2f2", marginLeft: 84 },
  loadMoreIndicator:{ paddingVertical: 16, alignItems: "center" },

  // Row
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 14,
  },

  // Avatar
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#f0f0f0",
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: PRIMARY_LIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontSize: 16,
    fontFamily: "PlusJakartaSansBold",
    color: PRIMARY,
  },

  // Row info
  rowInfo: { flex: 1 },
  rowName: {
    fontSize: 15,
    fontFamily: "PlusJakartaSansSemiBold",
    color: "#111",
    marginBottom: 3,
  },
  rowMeta: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans",
    color: "#aaa",
  },

  // Unblock button
  unblockBtn: {
    borderWidth: 1.5,
    borderColor: PRIMARY,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 7,
    minWidth: 78,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  unblockBtnPressed:  { backgroundColor: PRIMARY_LIGHT },
  unblockBtnDisabled: { borderColor: "#f0f0f0" },
  unblockBtnText: {
    fontSize: 13,
    fontFamily: "PlusJakartaSansSemiBold",
    color: PRIMARY,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: PRIMARY_LIGHT,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "PlusJakartaSansBold",
    color: "#111",
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans",
    color: "#888",
    textAlign: "center",
    lineHeight: 22,
  },
});

export default BlockedUsersScreen;