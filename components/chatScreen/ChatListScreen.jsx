import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { User, UserX } from "lucide-react-native";
import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../constant/colors";
import { images } from "../../constant/images";
import { formatRelativeDate } from "../../utils/helper";
import GeneralHeader from "../headers/GeneralHeader";
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
      {/* Gradient background — deep indigo to purple */}
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={bb.card}
      >

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
      </LinearGradient>
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
    // shadowColor: '#6366F1',
    // shadowOffset: { width: 0, height: 6 },
    // shadowOpacity: 0.28,
    // shadowRadius: 16,
    // elevation: 10,
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
    backgroundColor: colors.primaryLight,
    opacity: 0.25,
  },
  blobBR: {
    position: 'absolute', bottom: -20, right: -10,
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: colors.primaryLight,
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
    backgroundColor: colors.secondary,
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
    color: '#fff',
    lineHeight: 17,
  },

  // CTA
  ctaChip: {
    backgroundColor: colors.white,
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20,
  },
  ctaText: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: 13, color: colors.secondary,
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

  const [isAvatarCacheHydrated, setIsAvatarCacheHydrated] = React.useState(
    loadedAvatarUris.size > 0
  );

  const newMatches = isSocial ? [] : users.filter((user) => !user.hasChatted);
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
      <GeneralHeader title="Chats" className="text-white" icon={<UserX size={20} color="#fff" />} onPress={() => router.push('/unmatched-users')} />

      {/* ── Tabs ── */}
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

      {/* ── Active Chats panel ── */}
      <View style={styles.chatsPanel}>
        <Text style={styles.sectionLabelDark}>
          {isSocial ? "Plan Chats" : "Active chats"}
        </Text>

        {/* ── Bon Bot Card (dating only) ── */}
        {!isSocial && <BonBotCard onPress={() => router.push('/bon-bot')} />}

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
          <FlatList
            data={[
              ...users.filter((u) => u.isSystem),
              ...users.filter((u) => !u.isSystem),
            ]}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.matchItem} onPress={() => onSelectUser(item)}>
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
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  listContainer: { flex: 1, backgroundColor: '#121212' },

  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    // borderBottomWidth: 1,
    // borderBottomColor: '#333333',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  tabItemActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#111',
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

  // Chats panel
  chatsPanel: { flex: 1, backgroundColor: '#121212', borderTopLeftRadius: 28, borderTopRightRadius: 28 },

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
  emptyStateContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  emptyStateTitle: { fontSize: 18, fontFamily: 'PlusJakartaSansBold', color: '#E5E5E5', marginBottom: 6 },
  emptyStateSubtitle: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', fontFamily: 'PlusJakartaSans' },
  loadingLabel: { fontSize: 14, color: '#9CA3AF', marginTop: 10, textAlign: 'center', fontFamily: 'PlusJakartaSans' },
});

export default ChatListScreen;