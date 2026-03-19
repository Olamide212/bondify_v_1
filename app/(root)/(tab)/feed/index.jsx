/**
 * Bondup Feed Screen  —  app/(root)/(tab)/feed/index.jsx
 */

import { useRouter } from 'expo-router';
import { Plus, User } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import BondupCard from '../../../../components/bondup/BondupCard';
import BondupDetailModal from '../../../../components/bondup/BondupDetailModal';
import BondupJoinedModal from '../../../../components/bondup/BondupJoinedModal';
import CreateBondupModal from '../../../../components/bondup/CreateBondupModal';
import { colors } from '../../../../constant/colors';
import { images } from '../../../../constant/images';
import bondupChatService from '../../../../services/bondupChatService';
import bondupService from '../../../../services/bondupService';
import { socketService } from '../../../../services/socketService';

const BRAND = colors.primary;

// ─── Filters (current week + post type) ─────────────────────────────────────
const buildDayFilters = () => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayDay = startOfToday.getDay(); // 0 = Sunday
  const oneDayMs = 86400000;

  const offsets = [-1, 0, 1];
  const remainingDays = (7 - todayDay) % 7; // days left in this week including today
  for (let i = 2; i <= remainingDays; i += 1) {
    offsets.push(i); // remaining days in the current week
  }

  const chips = [{ key: 'all', label: 'All' }];
  const windows = { all: null };

  offsets.forEach((offset) => {
    const start = new Date(startOfToday.getTime() + offset * oneDayMs);
    const end = new Date(start.getTime() + oneDayMs);

    const label =
      offset === -1
        ? 'Yesterday'
        : offset === 0
          ? 'Today'
          : offset === 1
            ? 'Tomorrow'
            : start.toLocaleDateString(undefined, { weekday: 'long' });

    const key = `day_${offset}`;
    chips.push({ key, label });
    windows[key] = { start, end };
  });

  return { chips, windows };
};

const TYPE_CHIPS = [
  { key: 'join_me', label: 'Join Me' },
  { key: 'i_am_available', label: "I'm Available" },
];

// ─── Time filter (client-side) ───────────────────────────────────────────────
const applyTimeFilter = (items, filterKey, windows) => {
  if (filterKey === 'all') return items;
  const window = windows[filterKey];
  if (!window) return items;

  return items.filter((b) => {
    const d = new Date(b.dateTime);
    return d >= window.start && d < window.end;
  });
};

// ─── avatar helper ──────────────────────────────────────────────────────────
const avatar = (user) =>
  user?.profilePhoto || user?.images?.[0]?.url || user?.images?.[0] || null;

// ─── BondupFeedScreen ────────────────────────────────────────────────────────
export default function BondupFeedScreen() {
  const router = useRouter();
  const { user: currentUser } = useSelector((s) => s.auth);

  // ── State ────────────────────────────────────────────────────────────────
  const [bondups, setBondups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeDayFilter, setActiveDayFilter] = useState('all');
  const [activeTypeFilter, setActiveTypeFilter] = useState('join_me');
  const [detailBondup, setDetailBondup] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinedBondup, setJoinedBondup] = useState(null);
  const midnightTimeoutRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);

  const [filterData, setFilterData] = useState(() => buildDayFilters());
  const { chips: filterChips, windows: filterWindows } = filterData;

  const rebuildFilters = useCallback(() => {
    const next = buildDayFilters();
    setFilterData(next);
    setActiveDayFilter((prev) => (next.windows[prev] ? prev : 'all'));
  }, []);

  useEffect(() => {
    rebuildFilters();

    const scheduleMidnight = () => {
      const now = new Date();
      const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const timeoutMs = nextMidnight.getTime() - now.getTime();

      midnightTimeoutRef.current = setTimeout(() => {
        rebuildFilters();
        scheduleMidnight();
      }, timeoutMs);
    };

    scheduleMidnight();

    return () => {
      if (midnightTimeoutRef.current) {
        clearTimeout(midnightTimeoutRef.current);
      }
    };
  }, [rebuildFilters]);

  // Refresh filters and data when returning to foreground after a long suspend
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      const prevState = appStateRef.current;
      appStateRef.current = nextState;

      const wasSuspended = prevState !== 'active';
      if (wasSuspended && nextState === 'active') {
        rebuildFilters();
        loadBondups();
      }
    });

    return () => sub.remove();
  }, [loadBondups, rebuildFilters]);

  // ── Load bondups ─────────────────────────────────────────────────────────
  const loadBondups = useCallback(async () => {
    const seq = ++loadRequestRef.current;
    setLoading(true);
    try {
      const res = await bondupService.getPublicBondups({});

      if (seq === loadRequestRef.current) {
        let items = applyTimeFilter(res.data ?? [], activeDayFilter, filterWindows);
        items = items.filter((b) => (b.postType || 'join_me') === activeTypeFilter);
        setBondups(items);
      }
    } catch {
      // silent fail
    } finally {
      if (seq === loadRequestRef.current) {
        setLoading(false);
      }
    }
  }, [activeDayFilter, activeTypeFilter, filterWindows]);

  useEffect(() => {
    loadBondups();
  }, [loadBondups]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBondups();
    setRefreshing(false);
  };

  // ── Bondup actions ──────────────────────────────────────────────────────

  const handleJoin = async (bondupId) => {
    setJoinLoading(true);
    setBondups((prev) =>
      prev.map((b) =>
        b._id === bondupId
          ? { ...b, hasJoined: true, participants: [...(b.participants || []), { user: currentUser }] }
          : b
      )
    );
    setDetailBondup((d) =>
      d?._id === bondupId
        ? { ...d, hasJoined: true, participants: [...(d.participants || []), { user: currentUser }] }
        : d
    );
    try {
      const res = await bondupService.joinBondup(bondupId);
      if (res.success) {
        setBondups((prev) => prev.map((b) => (b._id === bondupId ? res.data : b)));
        setDetailBondup(null);
        setJoinedBondup(res.data);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'Could not join. Try again.';
      Alert.alert('Error', msg);
      loadBondups();
    } finally {
      setJoinLoading(false);
    }
  };

  const handleLeave = async (bondupId) => {
    setBondups((prev) =>
      prev.map((b) =>
        b._id === bondupId
          ? {
              ...b,
              hasJoined: false,
              participants: (b.participants || []).filter(
                (pt) => String(pt.user?._id || pt.user) !== String(currentUser?._id)
              ),
            }
          : b
      )
    );
    setDetailBondup((d) =>
      d?._id === bondupId
        ? {
            ...d,
            hasJoined: false,
            participants: (d.participants || []).filter(
              (pt) => String(pt.user?._id || pt.user) !== String(currentUser?._id)
            ),
          }
        : d
    );
    try {
      const res = await bondupService.leaveBondup(bondupId);
      if (res.success) {
        setBondups((prev) => prev.map((b) => (b._id === bondupId ? res.data : b)));
        setDetailBondup((d) => (d?._id === bondupId ? res.data : d));
      }
    } catch {
      loadBondups();
    }
  };

  const handleDelete = (bondupId) => {
    Alert.alert('Remove Bondup', 'Are you sure you want to remove this Bondup?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setBondups((prev) => prev.filter((b) => b._id !== bondupId));
          setDetailBondup((d) => (d?._id === bondupId ? null : d));
          try {
            await bondupService.deleteBondup(bondupId);
          } catch {
            loadBondups();
          }
        },
      },
    ]);
  };

  const handleCreated = (newBondup) => {
    setBondups((prev) => {
      if (prev.some((b) => b._id === newBondup._id)) return prev;
      return [newBondup, ...prev];
    });
    // No loadBondups() call — socket will update with server data
  };

  const handleStartChat = async (bondup) => {
    try {
      const res = await bondupChatService.startChat(bondup._id);
      if (res.success && res.data?._id) {
        const chatId = res.data._id;
        setBondups((prev) =>
          prev.map((b) => (b._id === bondup._id ? { ...b, chatId } : b))
        );
        setDetailBondup(null);
        router.push({
          pathname: '/bondup-chat',
          params: {
            chatId,
            bondupId: bondup._id,
            bondupTitle: bondup.title,
            participantCount: (bondup.participants?.length || 0) + 1,
          },
        });
      }
    } catch {
      Alert.alert('Error', 'Could not start chat. Try again.', [{ text: 'OK' }]);
    }
  };

  // ── Socket: real-time updates ────────────────────────────────────────────
  useEffect(() => {
    const handleNew = (b) => {
      setBondups((prev) => {
        if (prev.some((x) => x._id === b._id)) {
          return prev.map((x) => (x._id === b._id ? b : x));
        }
        return [b, ...prev];
      });
    };
    const handleUpdated = (b) => {
      setBondups((prev) => prev.map((x) => (x._id === b._id ? b : x)));
      setDetailBondup((d) => (d?._id === b._id ? b : d));
    };
    const handleRemoved = ({ bondupId }) => {
      setBondups((prev) => prev.filter((x) => x._id !== bondupId));
      setDetailBondup((d) => (d?._id === bondupId ? null : d));
    };

    socketService.on('bondup:new', handleNew);
    socketService.on('bondup:updated', handleUpdated);
    socketService.on('bondup:removed', handleRemoved);

    return () => {
      socketService.off('bondup:new', handleNew);
      socketService.off('bondup:updated', handleUpdated);
      socketService.off('bondup:removed', handleRemoved);
    };
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const userAvatar = avatar(currentUser);
  const hasBondups = bondups.length > 0;

  const renderSkeleton = () =>
    [1, 2, 3].map((i) => <View key={i} style={sk.skeletonCard} />);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={fStyles.container} edges={['top']}>
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <View style={fStyles.header}>
          <Image
            source={images.bonFeed}
            style={fStyles.headerLogo}
            resizeMode="contain"
          />
          {/* <TouchableOpacity onPress={() => router.push('/feed-profile')}>
            {userAvatar ? (
              <Image source={{ uri: userAvatar }} style={fStyles.headerAvatar} />
            ) : (
              <View style={[fStyles.headerAvatar, fStyles.headerAvatarFallback]}>
                <User size={18} color="#fff" />
              </View>
            )}
          </TouchableOpacity> */}
        </View>

        {/* ── Day filters ─────────────────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[fStyles.filterBar, { flexGrow: 0 }]}
          contentContainerStyle={fStyles.filterContent}
        >
          
          {filterChips.map((chip) => {
            const isActive = activeDayFilter === chip.key;
            return (
              <TouchableOpacity
                key={chip.key}
                style={[fStyles.filterChip, isActive && fStyles.filterChipActive]}
                onPress={() => setActiveDayFilter(chip.key)}
                activeOpacity={0.8}
              >
                <Text
                  style={[fStyles.filterChipText, isActive && fStyles.filterChipTextActive]}
                >
                  {chip.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Type filters (tab style) ─────────────────────────────────── */}
        <View style={[fStyles.filterBar, fStyles.typeTabBar]}>
          {TYPE_CHIPS.map((chip) => {
            const isActive = activeTypeFilter === chip.key;
            return (
              <TouchableOpacity
                key={chip.key}
                style={[fStyles.typeTab, isActive && fStyles.typeTabActive]}
                onPress={() => setActiveTypeFilter(chip.key)}
                activeOpacity={0.8}
              >
                <Text
                  style={[fStyles.typeTabText, isActive && fStyles.typeTabTextActive]}
                >
                  {chip.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Feed list ────────────────────────────────────────────────────── */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 110, paddingTop: 12 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[BRAND]}
              tintColor={BRAND}
            />
          }
        >
          {loading && !hasBondups ? (
            renderSkeleton()
          ) : !hasBondups ? (
            <View style={fStyles.emptyState}>
              <Text style={fStyles.emptyEmoji}>🤝</Text>
              <Text style={fStyles.emptyTitle}>No plans yet!</Text>
              <Text style={fStyles.emptySub}>
                Be the first to start a Bondup{'\n'}in your city!
              </Text>
              <TouchableOpacity
                style={fStyles.emptyBtn}
                onPress={() => setShowCreate(true)}
              >
                <Plus size={16} color="#fff" />
                <Text style={fStyles.emptyBtnText}>Create a Bondup</Text>
              </TouchableOpacity>
            </View>
          ) : (
            bondups.map((bondup) => (
              <BondupCard
                key={bondup._id}
                bondup={bondup}
                currentUserId={currentUser?._id}
                onJoin={handleJoin}
                onLeave={handleLeave}
                onDelete={handleDelete}
                onPress={setDetailBondup}
              />
            ))
          )}

          {loading && hasBondups && (
            <ActivityIndicator size="small" color={BRAND} style={{ marginVertical: 16 }} />
          )}
        </ScrollView>

        {/* ── FAB ─────────────────────────────────────────────────────────── */}
        <TouchableOpacity
          style={fStyles.fab}
          onPress={() => setShowCreate(true)}
          activeOpacity={0.85}
        >
          <Plus size={18} color="#fff" />
          <Text style={fStyles.fabText}>Create Bondup</Text>
        </TouchableOpacity>

        {/* ── Modals ──────────────────────────────────────────────────────── */}
        <CreateBondupModal
          visible={showCreate}
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />

        <BondupDetailModal
          visible={!!detailBondup}
          bondup={detailBondup}
          currentUserId={currentUser?._id}
          onClose={() => setDetailBondup(null)}
          onJoin={handleJoin}
          onLeave={handleLeave}
          onDelete={handleDelete}
          onStartChat={handleStartChat}
          joinLoading={joinLoading}
        />

        <BondupJoinedModal
          visible={!!joinedBondup}
          bondup={joinedBondup}
          currentUserId={currentUser?._id}
          onClose={() => setJoinedBondup(null)}
          onOpenChat={(b) => {
            setJoinedBondup(null);
            handleStartChat(b);
          }}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// ─── Feed styles ──────────────────────────────────────────────────────────────
const fStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerLogo: {
    height: 50,
    width: 110,
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
  },
  headerAvatarFallback: {
    backgroundColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Filter chips
  filterBar: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  filterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: 'transparent',
    marginRight: 8,
  },
  typeChipOffset: {
    marginLeft: 10,
  },
  filterChipActive: {
    borderColor: BRAND,
    backgroundColor: colors.primaryLight,
  },
  filterChipText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSansMedium',
    color: '#666',
  },
  filterChipTextActive: {
    color: BRAND,
    fontFamily: 'PlusJakartaSansBold',
  },

  // Type tabs (profile-style)
  typeTabBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  typeTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  typeTabActive: {
    borderBottomColor: BRAND,
  },
  typeTabText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSansBold',
    color: '#9CA3AF',
  },
  typeTabTextActive: {
    color: '#111',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSansBold',
    color: '#111',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans',
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: BRAND,
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 16,
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyBtnText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'PlusJakartaSansBold',
  },

  // FAB — pill button
  fab: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 30,
    backgroundColor: BRAND,
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  fabText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'PlusJakartaSansBold',
  },
});

// ─── Skeleton styles ──────────────────────────────────────────────────────────
const sk = StyleSheet.create({
  skeletonCard: {
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 20,
    height: 160,
    opacity: 0.5,
  },
});
