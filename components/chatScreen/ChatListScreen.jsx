import AsyncStorage from "@react-native-async-storage/async-storage";
import { User } from "lucide-react-native";
import React from "react";
import {
  ActivityIndicator,
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

const AVATAR_URI_CACHE_KEY = "@bondify/cache/chat/avatarUris";
const MAX_AVATAR_URI_CACHE_SIZE = 300;
const loadedAvatarUris = new Set();

const safeParse = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const trimLoadedAvatarUris = () => {
  while (loadedAvatarUris.size > MAX_AVATAR_URI_CACHE_SIZE) {
    const oldestUri = loadedAvatarUris.values().next().value;
    if (!oldestUri) break;
    loadedAvatarUris.delete(oldestUri);
  }
};

const touchLoadedAvatarUri = (uri) => {
  if (!uri) return;
  if (loadedAvatarUris.has(uri)) {
    loadedAvatarUris.delete(uri);
  }
  loadedAvatarUris.add(uri);
  trimLoadedAvatarUris();
};

const persistLoadedAvatarUris = async () => {
  try {
    trimLoadedAvatarUris();
    await AsyncStorage.setItem(
      AVATAR_URI_CACHE_KEY,
      JSON.stringify(Array.from(loadedAvatarUris))
    );
  } catch (error) {
    console.warn("Failed to persist avatar URI cache:", error?.message || error);
  }
};

const ChatListScreen = ({ users, onSelectUser, isLoading = false }) => {
  const [isAvatarCacheHydrated, setIsAvatarCacheHydrated] = React.useState(
    loadedAvatarUris.size > 0
  );

  const newMatches = users.filter((user) => !user.hasChatted);
  const placeholderSlots = Array.from({ length: 5 }, (_, index) => ({
    id: `placeholder-${index}`,
  }));

  React.useEffect(() => {
    let isMounted = true;

    const hydrateAvatarCache = async () => {
      try {
        const raw = await AsyncStorage.getItem(AVATAR_URI_CACHE_KEY);
        const parsed = safeParse(raw);
        if (Array.isArray(parsed)) {
          parsed
            .filter(Boolean)
            .slice(-MAX_AVATAR_URI_CACHE_SIZE)
            .forEach((uri) => touchLoadedAvatarUri(String(uri)));
        }
      } catch (error) {
        console.warn("Failed to hydrate avatar URI cache:", error?.message || error);
      } finally {
        if (isMounted) {
          setIsAvatarCacheHydrated(true);
        }
      }
    };

    hydrateAvatarCache();

    return () => {
      isMounted = false;
    };
  }, []);

  const getFirstName = (fullName) => {
    const normalized = String(fullName || "").trim();
    if (!normalized) return "Unknown";
    return normalized.split(/\s+/)[0];
  };

  const AvatarImage = ({ uri, style, iconSize = 20, isCacheReady = false }) => {
    const [loading, setLoading] = React.useState(
      Boolean(uri) && isCacheReady && !loadedAvatarUris.has(uri)
    );
    const [failed, setFailed] = React.useState(!uri);

    React.useEffect(() => {
      const shouldLoad =
        Boolean(uri) && isCacheReady && !loadedAvatarUris.has(uri);
      setLoading(shouldLoad);
      setFailed(!uri);
    }, [isCacheReady, uri]);

    return (
      <View style={[style, styles.avatarFallback]}>
        {!failed && uri ? (
          <Image
            source={{ uri }}
            style={style}
            onLoadStart={() => {
              if (isCacheReady && !loadedAvatarUris.has(uri)) {
                setLoading(true);
              }
              setFailed(false);
            }}
            onLoad={async () => {
              if (uri) {
                touchLoadedAvatarUri(uri);
                await persistLoadedAvatarUris();
              }

              setLoading(false);
              setFailed(false);
            }}
            onLoadEnd={() => {
              if (loadedAvatarUris.has(uri)) {
                setLoading(false);
              }
            }}
            onError={() => {
              setLoading(false);
              setFailed(true);
            }}
          />
        ) : (
          <User size={iconSize} color="#94A3B8" />
        )}

        {loading && (
          <View style={styles.avatarLoadingOverlay}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}
      </View>
    );
  };

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
                  <AvatarImage
                    uri={match.profileImage}
                    style={styles.newMatchImage}
                    iconSize={22}
                    isCacheReady={isAvatarCacheHydrated}
                  />
                  <Text
                    style={styles.newMatchName}
                    numberOfLines={1}
                    className="font-SatoshiBold capitalize"
                  >
                    {getFirstName(match.name)}
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
        {isLoading && users.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingLabel}>Loading conversations...</Text>
          </View>
        ) : users.length === 0 ? (
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
                  <AvatarImage
                    uri={item.profileImage}
                    style={styles.profileImage}
                    iconSize={20}
                    isCacheReady={isAvatarCacheHydrated}
                  />
                  {item.isOnline && <View style={styles.onlineIndicator} />}
                </View>

                <View style={styles.matchInfo}>
                  <Text style={styles.matchName} className='capitalize'>{getFirstName(item.name)}</Text>
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
  avatarFallback: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    overflow: "hidden",
  },
  avatarLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.45)",
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
    fontSize: 16,
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
  loadingLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 10,
    textAlign: "center",
  },
});

export default ChatListScreen;
