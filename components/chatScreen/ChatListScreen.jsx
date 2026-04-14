import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Bot, Inbox, User, UserX } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../constant/colors";
import { images } from "../../constant/images";
import MessageRequestService from "../../services/messageRequestService";
import { formatRelativeDate } from "../../utils/helper";
import VerifiedIcon from "../ui/VerifiedIcon";

// ─── Avatar URI cache (unchanged) ─────────────────────────────────────────────

const AVATAR_URI_CACHE_KEY = "@bondify/cache/chat/avatarUris";
const MAX_AVATAR_URI_CACHE_SIZE = 300;
const loadedAvatarUris = new Set();

const safeParse = (value) => { try { return JSON.parse(value); } catch { return null; } };

const trimLoadedAvatarUris = () => {
  while (loadedAvatarUris.size > MAX_AVATAR_URI_CACHE_SIZE) {
    const oldest = loadedAvatarUris.values().next().value;
    if (!oldest) break;
    loadedAvatarUris.delete(oldest);
  }
};

const touchLoadedAvatarUri = (uri) => {
  if (!uri) return;
  loadedAvatarUris.delete(uri);
  loadedAvatarUris.add(uri);
  trimLoadedAvatarUris();
};

const persistLoadedAvatarUris = async () => {
  try {
    trimLoadedAvatarUris();
    await AsyncStorage.setItem(AVATAR_URI_CACHE_KEY, JSON.stringify(Array.from(loadedAvatarUris)));
  } catch (e) {
    console.warn("Failed to persist avatar URI cache:", e?.message || e);
  }
};

// ─── ChatListScreen ───────────────────────────────────────────────────────────

const ChatListScreen = ({
  users,
  onSelectUser,
  isLoading = false,
  chatType = "dating",
  activeTab = 0,
  onTabChange,
  tabs = ["Dating", "Social"],
}) => {
  const router = useRouter();
  const isSocial = chatType === "social";

  // Message requests count for badge
  const [requestsCount, setRequestsCount] = useState(0);

  const [isAvatarCacheHydrated, setIsAvatarCacheHydrated] = React.useState(
    loadedAvatarUris.size > 0
  );

  const newMatches = isSocial ? [] : users.filter((user) => !user.hasChatted);
  const placeholderSlots = Array.from({ length: 5 }, (_, i) => ({ id: `placeholder-${i}` }));

  // Fetch message requests count (dating only)
  const fetchRequestsCount = useCallback(async () => {
    if (isSocial) return;
    try {
      const response = await MessageRequestService.getPendingCount();
      if (response.success) {
        setRequestsCount(response.data?.count || 0);
      }
    } catch (error) {
      console.warn('Failed to fetch requests count:', error);
    }
  }, [isSocial]);

  // Load requests count on mount
  useEffect(() => {
    if (!isSocial) {
      fetchRequestsCount();
    }
  }, [isSocial, fetchRequestsCount]);

  React.useEffect(() => {
    let isMounted = true;
    const hydrate = async () => {
      try {
        const raw = await AsyncStorage.getItem(AVATAR_URI_CACHE_KEY);
        const parsed = safeParse(raw);
        if (Array.isArray(parsed)) {
          parsed.filter(Boolean).slice(-MAX_AVATAR_URI_CACHE_SIZE).forEach((uri) => touchLoadedAvatarUri(String(uri)));
        }
      } catch (e) {
        console.warn("Failed to hydrate avatar URI cache:", e?.message || e);
      } finally {
        if (isMounted) setIsAvatarCacheHydrated(true);
      }
    };
    hydrate();
    return () => { isMounted = false; };
  }, []);

  const getFirstName = (fullName) => {
    const n = String(fullName || '').trim();
    return n ? n.split(/\s+/)[0] : 'Unknown';
  };

  const AvatarImage = ({ uri, style, iconSize = 20, isCacheReady = false }) => {
    const [loading, setLoading] = React.useState(Boolean(uri) && isCacheReady && !loadedAvatarUris.has(uri));
    const [failed, setFailed]   = React.useState(!uri);

    React.useEffect(() => {
      setLoading(Boolean(uri) && isCacheReady && !loadedAvatarUris.has(uri));
      setFailed(!uri);
    }, [isCacheReady, uri]);

    return (
      <View style={[style, styles.avatarFallback]}>
        {!failed && uri ? (
          <Image
            source={{ uri }}
            style={style}
            cachePolicy="memory-disk"
            transition={150}
            onLoadStart={() => { if (isCacheReady && !loadedAvatarUris.has(uri)) setLoading(true); setFailed(false); }}
            onLoad={async () => { if (uri) { touchLoadedAvatarUri(uri); await persistLoadedAvatarUris(); } setLoading(false); setFailed(false); }}
            onError={() => { setLoading(false); setFailed(true); }}
          />
        ) : (
          <User size={iconSize} color="#fff" />
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
    <SafeAreaView style={styles.listContainer} edges={['top']}>
      {/* ── Custom Header ── */}
      <View style={styles.header}>
        {/* Left: AI Bot icon */}
        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={() => router.push('/bon-bot')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Bot size={25} color={colors.primary} />
        </TouchableOpacity>

        {/* Center: Title */}
        <Text style={styles.headerTitle}>Chats</Text>

        {/* Right: Requests + Unmatched icons */}
        <View style={styles.headerRightIcons}>
          {!isSocial && (
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => router.push('/message-requests')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Inbox size={20} color="#fff" />
              {requestsCount > 0 && (
                <View style={styles.headerBadge}>
                  <Text style={styles.headerBadgeText}>
                    {requestsCount > 9 ? '9+' : requestsCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => router.push('/unmatched-users')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <UserX size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Tabs (Dating / Social) ── */}
      <View style={styles.tabBar}>
        {tabs.map((t, i) => (
          <TouchableOpacity
            key={t}
            style={[          
              styles.tabItem,
              activeTab === i && styles.tabItemActive,
            ]}
            onPress={() => onTabChange?.(i)}
          >
            <Text
              style={[
                styles.tabLabel,
                activeTab === i ? styles.tabLabelActive : styles.tabLabelInactive,
              ]}
            >
              {t}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Scrollable Content ── */}
      <ScrollView 
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* ── New Matches (dating only) ── */}
        {!isSocial && (
          <>
            <Text style={styles.sectionLabel}>New Matches</Text>
            <View style={styles.newMatchesWrapper}>
              <FlatList
                data={placeholderSlots}
                horizontal
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingLeft: 16, paddingRight: 8 }}
                scrollEnabled={true}
                renderItem={({ index }) => {
                  const match = newMatches[index];
                  if (match) {
                    return (
                      <TouchableOpacity style={styles.newMatchItem} onPress={() => onSelectUser(match)}>
                        <View>
                          <AvatarImage uri={match.profileImage} style={styles.newMatchImage} iconSize={22} isCacheReady={isAvatarCacheHydrated} />
                          {match.verified && (
                            <View style={styles.newMatchVerified}>
                              <VerifiedIcon style={{ width: 16, height: 16 }} />
                            </View>
                          )}
                          {(match.isSystem) && (
                            <MaterialIcons name="verified" size={20} color={"#F6CE71"} style={{ marginLeft: 4 }} />
                          )}
                        </View>
                        <Text style={styles.newMatchName} numberOfLines={1}>{getFirstName(match.name)}</Text>
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
          </>
        )}

        {/* ── Chats Section Label ── */}
        <Text style={styles.sectionLabelDark}>
          {isSocial ? "Plan Chats" : "Active chats"}
        </Text>

        {/* ── Conversation list ── */}
        {isLoading && users.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingLabel}>
              {isSocial ? "Loading plan chats..." : "Loading conversations..."}
            </Text>
          </View>
        ) : users.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateTitle}>
              {isSocial ? "No plan chats yet" : "No conversations yet"}
            </Text>
            <Text style={styles.emptyStateSubtitle}>
              {isSocial
                ? "Join or create plans to start group chats."
                : "Your matches and chats will appear here."}
            </Text>
          </View>
        ) : (
          [...users.filter((u) => u.isSystem), ...users.filter((u) => !u.isSystem)].map((item) => (
            <TouchableOpacity key={item.id} style={styles.matchItem} onPress={() => onSelectUser(item)}>
              <View style={styles.profileContainer}>
                {item.isSystem ? (
                  <View style={[styles.profileImage, styles.avatarFallback, styles.systemAvatar]}>
                    <Image
                      source={images.bondiesMainicon}
                      style={{ width: 36, height: 36 }}
                      resizeMode="contain"
                    />
                  </View>
                ) : (
                  <AvatarImage uri={item.profileImage} style={styles.profileImage} iconSize={20} isCacheReady={isAvatarCacheHydrated} />
                )}
                {item.isOnline && !item.isSystem && <View style={styles.onlineIndicator} />}
              </View>
              <View style={styles.matchInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.matchName}>
                    {item.isSystem ? item.name : getFirstName(item.name)}
                  </Text>
                  {item.isVerified && (
                    <VerifiedIcon style={styles.verifiedBadge} />
                  )}
                </View>
                <Text style={styles.matchMessage} numberOfLines={1}>
                  {item.lastMessage || 'No messages yet'}
                </Text>
              </View>
              <View style={styles.matchMeta}>
                <Text style={styles.matchTime}>{formatRelativeDate(item.matchedDate)}</Text>
                {item.unread > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{item.unread}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  listContainer: { flex: 1, backgroundColor: '#121212' },

  // Custom Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.background,
  },
  headerIconBtn: {
    position: 'relative',
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSansBold',
    color: '#fff',
  },
  headerRightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerBadge: {
    position: 'absolute',
    top: -2,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  headerBadgeText: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSansBold',
    color: '#fff',
  },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  tabItemActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabLabel: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSansBold',
  },
  tabLabelActive: {
    color: '#E5E5E5',
  },
  tabLabelInactive: {
    color: '#9CA3AF',
  },

  // Scrollable content
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },

  sectionLabel: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: 15,
    color: '#FFFFFF',
    paddingLeft: 20,
    paddingBottom: 8,
    paddingTop: 10,
  },
  sectionLabelDark: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: 15,
    color: '#FFFFFF',
    paddingLeft: 20,
    paddingTop: 18,
    paddingBottom: 8,
  },

  // New matches row
  newMatchesWrapper: {
    paddingBottom: 12,
    flexDirection: 'row',
  },
  newMatchItem: { marginRight: 22, alignItems: 'center', width: 72 },
  newMatchImage: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#E5E7EB' },
  newMatchVerified: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#121212',
    borderRadius: 10,
    padding: 1,
  },
  placeholderCircle: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 2, borderStyle: 'dashed',
    borderColor: '#CBD5E1', backgroundColor: 'transparent',
  },
  placeholderLabel: { fontSize: 11, color: '#94A3B8', marginTop: 6, textAlign: 'center' },
  newMatchName: {
    fontSize: 12, fontFamily: 'PlusJakartaSansBold',
    color: '#E5E7EB', marginTop: 5, textAlign: 'center',
    textTransform: 'capitalize',
  },

  // Chat row
  matchItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 13, paddingHorizontal: 18,
    borderBottomWidth: 0.2, borderBottomColor: '#333333',
  },
  profileContainer: { position: 'relative', marginRight: 14 },
  profileImage: { width: 54, height: 54, borderRadius: 27 },
  avatarFallback: {
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#1E1E1E', overflow: 'hidden',
  },
  avatarLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  onlineIndicator: {
    position: 'absolute', bottom: 2, right: 2,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#10B981', borderWidth: 2, borderColor: '#fff',
  },
  matchInfo: { flex: 1, justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  matchName: { fontSize: 15, fontFamily: 'PlusJakartaSansBold', color: '#E5E7EB', textTransform: 'capitalize' },
  verifiedBadge: { width: 15, height: 15 },
  systemAvatar: { backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  matchMessage: { fontSize: 13, color: '#9CA3AF', marginTop: 3, fontFamily: 'PlusJakartaSans' },
  matchMeta: { alignItems: 'flex-end' },
  matchTime: { fontSize: 11, color: '#9CA3AF', fontFamily: 'PlusJakartaSans' },
  unreadBadge: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center', marginTop: 5,
  },
  unreadText: { color: '#fff', fontSize: 11, fontFamily: 'PlusJakartaSansBold' },

  // Empty / loading states
  emptyStateContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  emptyStateTitle: { fontSize: 18, fontFamily: 'PlusJakartaSansBold', color: '#E5E5E5', marginBottom: 6, marginTop: 12 },
  emptyStateSubtitle: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', fontFamily: 'PlusJakartaSans' },
  loadingLabel: { fontSize: 14, color: '#9CA3AF', marginTop: 10, textAlign: 'center', fontFamily: 'PlusJakartaSans' },
});

export default ChatListScreen;