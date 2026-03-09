import AsyncStorage from "@react-native-async-storage/async-storage";
import { User } from "lucide-react-native";
import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../constant/colors";
import { images } from "../../constant/images";
import GeneralHeader from "../headers/GeneralHeader";
import { formatRelativeDate } from "../../utils/helper";
import { useRouter } from "expo-router";

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

// ─── Bon Bot Card ─────────────────────────────────────────────────────────────

const BonBotCard = ({ onPress }) => {
  // Gentle pulse on the glow ring
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Slow breathing pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 1800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 1800, useNativeDriver: true }),
      ])
    ).start();

    // Shimmer sweep on the label
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 2200, useNativeDriver: true }),
        Animated.delay(1400),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 0,    useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [-60, 120],
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.92}
      style={bb.wrapper}
    >
      {/* Gradient-feel background — deep indigo to warm orange */}
      <View style={bb.card}>

        {/* Decorative blobs */}
        <View style={bb.blobTL} />
        <View style={bb.blobBR} />

        <View style={bb.inner}>
          {/* ── Avatar with pulse ring ── */}
          <View style={bb.avatarContainer}>
            {/* Outer animated glow ring */}
            <Animated.View style={[bb.glowRing, { transform: [{ scale: pulseAnim }] }]} />
            {/* Avatar */}
            <View style={bb.avatarBorder}>
              <Image
                source={images.BOT_AVARTAR}
                style={bb.avatar}
                resizeMode="cover"
              />
            </View>
            {/* Live indicator */}
            <View style={bb.liveDot}>
              <View style={bb.liveDotInner} />
            </View>
          </View>

          {/* ── Text block ── */}
          <View style={bb.textBlock}>
            <View style={bb.nameRow}>
              <Text style={bb.name}>Bon Bot</Text>
              {/* AI badge */}
              <View style={bb.aiBadge}>
                <Text style={bb.aiBadgeText}>AI</Text>
              </View>
            </View>
            <Text style={bb.tagline} numberOfLines={2}>
              Your dating coach — ask me anything 💬
            </Text>
          </View>

          {/* ── CTA chip ── */}
          <View style={bb.ctaChip}>
            <Text style={bb.ctaText}>Chat</Text>
          </View>
        </View>

        {/* Shimmer overlay on the entire card */}
        <Animated.View
          pointerEvents="none"
          style={[bb.shimmer, { transform: [{ translateX: shimmerTranslate }] }]}
        />
      </View>
    </TouchableOpacity>
  );
};

const bb = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
    marginBottom: 16,
    marginTop: 4,
    borderRadius: 22,
    // Card shadow
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 10,
  },
  card: {
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#1E1B4B',      // deep indigo base
    padding: 18,
  },

  // Decorative blobs
  blobTL: {
    position: 'absolute', top: -30, left: -30,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: '#6366F1',
    opacity: 0.25,
  },
  blobBR: {
    position: 'absolute', bottom: -20, right: -10,
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#E8651A',
    opacity: 0.22,
  },

  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },

  // Avatar
  avatarContainer: { position: 'relative', width: 60, height: 60 },
  glowRing: {
    position: 'absolute',
    top: -6, left: -6,
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 1.5,
    borderColor: '#818CF8',
    opacity: 0.6,
  },
  avatarBorder: {
    width: 60, height: 60, borderRadius: 30,
    borderWidth: 2, borderColor: '#818CF8',
    overflow: 'hidden',
    backgroundColor: '#312E81',
  },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  liveDot: {
    position: 'absolute', bottom: 1, right: 1,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: '#1E1B4B',
    alignItems: 'center', justifyContent: 'center',
  },
  liveDotInner: {
    width: 9, height: 9, borderRadius: 5,
    backgroundColor: '#34D399',
  },

  // Text
  textBlock: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 4 },
  name: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: 17,
    color: '#fff',
    letterSpacing: -0.2,
  },
  aiBadge: {
    backgroundColor: '#E8651A',
    paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: 6,
  },
  aiBadgeText: {
    fontSize: 10, fontFamily: 'PlusJakartaSansBold',
    color: '#fff', letterSpacing: 0.5,
  },
  tagline: {
    fontFamily: 'PlusJakartaSans',
    fontSize: 12,
    color: '#A5B4FC',
    lineHeight: 17,
  },

  // CTA
  ctaChip: {
    backgroundColor: '#E8651A',
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20,
  },
  ctaText: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: 13, color: '#fff',
  },

  // Shimmer
  shimmer: {
    position: 'absolute',
    top: 0, bottom: 0,
    width: 50,
    backgroundColor: 'rgba(255,255,255,0.07)',
    transform: [{ skewX: '-18deg' }],
  },
});

// ─── ChatListScreen ───────────────────────────────────────────────────────────

const ChatListScreen = ({ users, onSelectUser, isLoading = false }) => {
  const router = useRouter();

  const [isAvatarCacheHydrated, setIsAvatarCacheHydrated] = React.useState(
    loadedAvatarUris.size > 0
  );

  const newMatches = users.filter((user) => !user.hasChatted);
  const placeholderSlots = Array.from({ length: 5 }, (_, i) => ({ id: `placeholder-${i}` }));

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
            onLoadStart={() => { if (isCacheReady && !loadedAvatarUris.has(uri)) setLoading(true); setFailed(false); }}
            onLoad={async () => { if (uri) { touchLoadedAvatarUri(uri); await persistLoadedAvatarUris(); } setLoading(false); setFailed(false); }}
            onLoadEnd={() => { if (loadedAvatarUris.has(uri)) setLoading(false); }}
            onError={() => { setLoading(false); setFailed(true); }}
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
      <GeneralHeader title="Chats" className="text-black" />

      {/* ── New Matches ── */}
      <Text style={styles.sectionLabel}>New Matches</Text>
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
                <TouchableOpacity style={styles.newMatchItem} onPress={() => onSelectUser(match)}>
                  <AvatarImage uri={match.profileImage} style={styles.newMatchImage} iconSize={22} isCacheReady={isAvatarCacheHydrated} />
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

      {/* ── Active Chats panel ── */}
      <View style={styles.chatsPanel}>
        <Text style={styles.sectionLabelDark}>Active chats</Text>

        {/* ── Bon Bot Card ── */}
        <BonBotCard onPress={() => router.push('/bon-bot')} />

        {/* ── Conversation list ── */}
        {isLoading && users.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingLabel}>Loading conversations...</Text>
          </View>
        ) : users.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateTitle}>No conversations yet</Text>
            <Text style={styles.emptyStateSubtitle}>Your matches and chats will appear here.</Text>
          </View>
        ) : (
          <FlatList
            data={users}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.matchItem} onPress={() => onSelectUser(item)}>
                <View style={styles.profileContainer}>
                  <AvatarImage uri={item.profileImage} style={styles.profileImage} iconSize={20} isCacheReady={isAvatarCacheHydrated} />
                  {item.isOnline && <View style={styles.onlineIndicator} />}
                </View>
                <View style={styles.matchInfo}>
                  <Text style={styles.matchName}>{getFirstName(item.name)}</Text>
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
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  listContainer: { flex: 1, backgroundColor: '#fff' },

  sectionLabel: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: 15,
    color: '#111827',
    paddingLeft: 20,
    paddingBottom: 8,
    paddingTop: 10,
  },
  sectionLabelDark: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: 15,
    color: '#111827',
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
  placeholderCircle: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 2, borderStyle: 'dashed',
    borderColor: '#CBD5E1', backgroundColor: 'transparent',
  },
  placeholderLabel: { fontSize: 11, color: '#94A3B8', marginTop: 6, textAlign: 'center' },
  newMatchName: {
    fontSize: 12, fontFamily: 'PlusJakartaSansBold',
    color: '#1F2937', marginTop: 5, textAlign: 'center',
    textTransform: 'capitalize',
  },

  // Chats panel
  chatsPanel: { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28 },

  // Chat row
  matchItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 13, paddingHorizontal: 18,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  profileContainer: { position: 'relative', marginRight: 14 },
  profileImage: { width: 54, height: 54, borderRadius: 27 },
  avatarFallback: {
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#F8FAFC', overflow: 'hidden',
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
  matchName: { fontSize: 15, fontFamily: 'PlusJakartaSansBold', color: '#1F2937', textTransform: 'capitalize' },
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
  emptyStateContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  emptyStateTitle: { fontSize: 18, fontFamily: 'PlusJakartaSansBold', color: '#111', marginBottom: 6 },
  emptyStateSubtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', fontFamily: 'PlusJakartaSans' },
  loadingLabel: { fontSize: 14, color: '#6B7280', marginTop: 10, textAlign: 'center', fontFamily: 'PlusJakartaSans' },
});

export default ChatListScreen;