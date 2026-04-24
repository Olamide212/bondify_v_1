/**
 * Bondup Feed Screen  —  app/(tabs)/feed/index.jsx
 *
 * Persistence fix: Uses AsyncStorage to cache Bondups locally so they persist
 * across navigation and app restarts. Implements stale-while-revalidate pattern.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { ArrowUpDown, Building2, Plus, User } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import BondupCard from '../../components/bondup/BondupCard';
import BondupDetailModal from '../../components/bondup/BondupDetailModal';
import BondupJoinedModal from '../../components/bondup/BondupJoinedModal';
import CreateBondupModal from '../../components/bondup/CreateBondupModal';
import BondupFilterModal from '../../components/modals/BondupFilterModal';
import { colors } from '../../constant/colors';
import { images } from '../../constant/images';
import { useAlert } from '../../context/AlertContext';
import bondupChatService from '../../services/bondupChatService';
import bondupService from '../../services/bondupService';
import { socketService } from '../../services/socketService';

// ─── Cache keys for persistence ──────────────────────────────────────────────
const BONDUPS_CACHE_KEY = '@bondify/cache/bondups';
const BONDUPS_CACHE_TIMESTAMP_KEY = '@bondify/cache/bondups_ts';
const BONDUPS_FILTERS_KEY = '@bondify/cache/bondups_filters';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ─── Client-side sort helper ─────────────────────────────────────────────────
const sortBondups = (items, sortBy) => {
  const sorted = [...items];
  if (sortBy === 'newest') {
    sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else {
    // 'soonest' — by dateTime ascending
    sorted.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
  }
  return sorted;
};

const safeParse = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const BRAND = colors.primary;

// ─── Filters (current week + post type) ─────────────────────────────────────
const buildDayFilters = () => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const oneDayMs = 86400000;

  // Show: yesterday, today, tomorrow, and the next 7 days
  const offsets = [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8];

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
            : start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

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
  const [hasActivated, setHasActivated] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setHasActivated(true);
    }, [])
  );

  if (!hasActivated) {
    return <View style={{ flex: 1, backgroundColor: '#121212' }} />;
  }

  return <BondupFeedScreenContent />;
}

function BondupFeedScreenContent() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const { user: currentUser } = useSelector((s) => s.auth);

  // ── State ────────────────────────────────────────────────────────────────
  const [allBondups, setAllBondups] = useState([]);   // raw API data
  const [bondups, setBondups] = useState([]);           // filtered for display
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeDayFilter, setActiveDayFilter] = useState('all');
  const [activeTypeFilter, setActiveTypeFilter] = useState('join_me');
  const [detailBondup, setDetailBondup] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinedBondup, setJoinedBondup] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    city: '',
    categories: [],
    distance: null,
    sortBy: 'soonest',
  });
  const filtersRestoredRef = useRef(false);
  const loadRequestRef = useRef(0);
  const midnightTimeoutRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);
  const hasRestoredCache = useRef(false);

  const [filterData, setFilterData] = useState(() => buildDayFilters());
  const { chips: filterChips, windows: filterWindows } = filterData;

  // ── Restore persisted filters from AsyncStorage ──────────────────────────
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(BONDUPS_FILTERS_KEY);
        const parsed = safeParse(raw);
        if (isMounted && parsed && typeof parsed === 'object') {
          setActiveFilters((prev) => ({ ...prev, ...parsed }));
        }
      } catch { /* silent */ }
      if (isMounted) filtersRestoredRef.current = true;
    })();
    return () => { isMounted = false; };
  }, []);

  // ── Persist filters whenever they change ─────────────────────────────────
  useEffect(() => {
    if (!filtersRestoredRef.current) return; // don't persist the default before restore
    AsyncStorage.setItem(BONDUPS_FILTERS_KEY, JSON.stringify(activeFilters)).catch(() => {});
  }, [activeFilters]);

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

  // ── Persist bondups to AsyncStorage ──────────────────────────────────────
  const persistBondups = useCallback(async (data) => {
    try {
      await AsyncStorage.setItem(BONDUPS_CACHE_KEY, JSON.stringify(data));
      await AsyncStorage.setItem(BONDUPS_CACHE_TIMESTAMP_KEY, String(Date.now()));
    } catch {
      // silent fail
    }
  }, []);

  // ── Restore bondups from AsyncStorage (stale-while-revalidate) ───────────
  useEffect(() => {
    let isMounted = true;
    const restoreCache = async () => {
      if (hasRestoredCache.current) return;
      try {
        const cached = await AsyncStorage.getItem(BONDUPS_CACHE_KEY);
        const parsed = safeParse(cached);
        if (isMounted && Array.isArray(parsed) && parsed.length > 0) {
          setAllBondups(parsed);
          hasRestoredCache.current = true;
        }
      } catch {
        // silent fail
      }
    };
    restoreCache();
    return () => { isMounted = false; };
  }, []);

  // ── Load bondups (fetches ALL, stores raw, persists to cache) ────────────
  const loadBondups = useCallback(async () => {
    const seq = ++loadRequestRef.current;
    setLoading(true);
    try {
      // Get user's city for filtering public bondups
      const userCity = activeFilters.city || currentUser?.socialProfile?.city || currentUser?.location?.city || '';

      // Build query params from active filters
      const filterParams = {};
      if (activeFilters.categories.length > 0) {
        filterParams.categories = activeFilters.categories.join(',');
      }
      if (activeFilters.sortBy) {
        filterParams.sort = activeFilters.sortBy;
      }
      if (activeFilters.distance) {
        filterParams.distance = activeFilters.distance;
      }

      // Load both public and circle bondups
      const [publicRes, circleRes] = await Promise.all([
        bondupService.getPublicBondups({ city: userCity, ...filterParams }).catch(() => null),
        bondupService.getCircleBondups({ ...filterParams }).catch(() => null),
      ]);

      // If BOTH calls failed, keep existing data (stale-while-revalidate)
      if (!publicRes && !circleRes) {
        return;
      }

      const publicData = publicRes?.data ?? [];
      const circleData = circleRes?.data ?? [];

      // Deduplicate by _id, then apply client-side sort to maintain order
      // after merging two separately-sorted arrays
      const seen = new Set();
      const merged = [];
      for (const b of [...publicData, ...circleData]) {
        if (!seen.has(b._id)) {
          seen.add(b._id);
          merged.push(b);
        }
      }
      const allData = sortBondups(merged, activeFilters.sortBy);

      if (seq === loadRequestRef.current) {
        // Only replace with empty data if we DON'T already have data
        // (prevents transient empty API responses from clearing the list)
        if (allData.length > 0) {
          setAllBondups(allData);
          persistBondups(allData);
        } else {
          // If we have no cached data either, accept the empty result
          setAllBondups((prev) => (prev.length > 0 ? prev : allData));
        }
      }
    } catch {
      // On network error, keep existing data (stale-while-revalidate)
    } finally {
      if (seq === loadRequestRef.current) {
        setLoading(false);
      }
    }
  }, [persistBondups, activeFilters]);

  useEffect(() => {
    loadBondups();
  }, [loadBondups]);

  // ── Apply day + type filters whenever raw data or filters change ─────────
  useEffect(() => {
    // First, strip out expired bondups (dateTime in the past + 24h grace)
    const now = Date.now();
    const fresh = allBondups.filter((b) => {
      if (!b.dateTime) return true;
      // Keep bondups whose dateTime + 24 hours hasn't passed yet
      const expiresMs = new Date(b.expiresAt || b.dateTime).getTime() + (b.expiresAt ? 0 : 86400000);
      return expiresMs > now;
    });

    let items = applyTimeFilter(fresh, activeDayFilter, filterWindows);
    items = items.filter((b) => (b.postType || 'join_me') === activeTypeFilter);
    setBondups(items);
  }, [allBondups, activeDayFilter, activeTypeFilter, filterWindows]);

  // ── Persist allBondups changes to AsyncStorage (debounced) ───────────────
  const persistTimeoutRef = useRef(null);
  useEffect(() => {
    // Debounce persistence to avoid excessive writes on rapid state changes
    if (persistTimeoutRef.current) {
      clearTimeout(persistTimeoutRef.current);
    }
    
    if (allBondups.length > 0) {
      persistTimeoutRef.current = setTimeout(() => {
        persistBondups(allBondups);
      }, 500); // Wait 500ms after last change before persisting
    }
    
    return () => {
      if (persistTimeoutRef.current) {
        clearTimeout(persistTimeoutRef.current);
      }
    };
  }, [allBondups, persistBondups]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBondups();
    setRefreshing(false);
  };

  // ── Bondup actions ──────────────────────────────────────────────────────

  const handleJoin = async (bondupId) => {
    setJoinLoading(true);
    setAllBondups((prev) =>
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
        setAllBondups((prev) => prev.map((b) => (b._id === bondupId ? res.data : b)));
        setDetailBondup(null);
        setJoinedBondup(res.data);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'Could not join. Try again.';
      showAlert({
        icon: 'error',
        title: 'Error',
        message: msg,
      });
      loadBondups();
    } finally {
      setJoinLoading(false);
    }
  };

  const handleLeave = async (bondupId) => {
    setAllBondups((prev) =>
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
        setAllBondups((prev) => prev.map((b) => (b._id === bondupId ? res.data : b)));
        setDetailBondup((d) => (d?._id === bondupId ? res.data : d));
      }
    } catch {
      loadBondups();
    }
  };

  const handleJoinChat = async (bondupId) => {
    try {
      const bondup = allBondups.find(b => b._id === bondupId);
      if (!bondup) return;

      const chatRes = await bondupChatService.startChat(bondupId);
      if (chatRes.success) {
        const chatId = chatRes.data._id;
        router.push({
          pathname: '/bondup-chat',
          params: {
            chatId,
            bondupId: bondup._id,
            bondupTitle: bondup.title,
            participantCount: bondup.participants?.length || 0,
          },
        });
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'Could not join chat. Try again.';
      showAlert({
        icon: 'error',
        title: 'Error',
        message: msg,
      });
    }
  };

  const handleDelete = async (bondupId) => {
    // Optimistic update
    setAllBondups((prev) => prev.filter((b) => b._id !== bondupId));
    setDetailBondup((d) => (d?._id === bondupId ? null : d));
    try {
      await bondupService.deleteBondup(bondupId);
    } catch {
      loadBondups();
    }
  };

  const handleCreated = (newBondup) => {
    setAllBondups((prev) => {
      if (prev.some((b) => b._id === newBondup._id)) return prev;
      return [newBondup, ...prev];
    });
    // Also switch to the created bondup's type tab so user sees it immediately
    if (newBondup.postType && newBondup.postType !== activeTypeFilter) {
      setActiveTypeFilter(newBondup.postType);
    }
  };

  const handleStartChat = async (bondup) => {
    try {
      const res = await bondupChatService.startChat(bondup._id);
      if (res.success && res.data?._id) {
        const chatId = res.data._id;
        setAllBondups((prev) =>
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
      showAlert({
        icon: 'error',
        title: 'Error',
        message: 'Could not start chat. Try again.',
      });
    }
  };

  // ── Socket: real-time updates ────────────────────────────────────────────
  useEffect(() => {
    const handleNew = (b) => {
      setAllBondups((prev) => {
        if (prev.some((x) => x._id === b._id)) {
          return prev.map((x) => (x._id === b._id ? b : x));
        }
        return [b, ...prev];
      });
    };
    const handleUpdated = (b) => {
      setAllBondups((prev) => prev.map((x) => (x._id === b._id ? b : x)));
      setDetailBondup((d) => (d?._id === b._id ? b : d));
    };
    const handleRemoved = ({ bondupId }) => {
      setAllBondups((prev) => prev.filter((x) => x._id !== bondupId));
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
  const hasActiveFilters =
    activeFilters.city.trim() !== '' ||
    activeFilters.categories.length > 0 ||
    activeFilters.distance !== null ||
    activeFilters.sortBy !== 'soonest';

  const renderSkeleton = () =>
    [1, 2, 3].map((i) => <View key={i} style={sk.skeletonCard} />);

  const userCity = currentUser?.socialProfile?.city || currentUser?.location?.city || 'your city';

  return (
    <SafeAreaProvider>
      <SafeAreaView style={fStyles.container} edges={['top']}>
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <View style={fStyles.header}>
          <Image
            source={images.bonFeed}
            style={fStyles.headerLogo}
            contentFit="contain"
          />
          <View style={fStyles.headerRight}>
            <TouchableOpacity
              onPress={() => setShowFilter(true)}
              style={fStyles.filterIconBtn}
              activeOpacity={0.7}
            >
              <ArrowUpDown size={20} color="#fff" />
              {hasActiveFilters && <View style={fStyles.filterDot} />}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push(`/bondup-profile/${currentUser?._id}`)}>
              {userAvatar ? (
                <Image source={{ uri: userAvatar }} style={fStyles.headerAvatar} cachePolicy="memory-disk" transition={150} />
              ) : (
                <View style={[fStyles.headerAvatar, fStyles.headerAvatarFallback]}>
                  <User size={18} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          </View>
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
                Be the first to start a Bondup in
              </Text>
              {/* Highlighted city with background and icon */}
              <View style={fStyles.cityHighlightContainer}>
                <Building2 size={28} color={colors.primary} style={fStyles.cityIcon} />
                <Text style={fStyles.cityHighlightText} numberOfLines={1}>{userCity}</Text>
              </View>
              {/* <TouchableOpacity
                style={fStyles.emptyBtn}
                onPress={() => setShowCreate(true)}
              >
                <Plus size={16} color="#fff" />
                <Text style={fStyles.emptyBtnText}>Create a Bondup</Text>
              </TouchableOpacity> */}
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
                onJoinChat={handleJoinChat}
              />
            ))
          )}

          {loading && hasBondups && (
            <ActivityIndicator size="small" color={BRAND} style={{ marginVertical: 16 }} />
          )}
        </ScrollView>

        {/* ── FAB ─────────────────────────────────────────────────────────── */}
        <LinearGradient colors={[colors.primary, colors.secondary]}       style={fStyles.fab}>
        <TouchableOpacity
          onPress={() => setShowCreate(true)}
          activeOpacity={0.85}
        >
          <Plus size={30} color="#fff" />
         
        </TouchableOpacity>
        </LinearGradient>

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

        <BondupFilterModal
          visible={showFilter}
          onClose={() => setShowFilter(false)}
          initialFilters={activeFilters}
          onApply={(filters) => {
            setActiveFilters(filters);
            setShowFilter(false);
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
    backgroundColor: '#121212',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#121212',
    // borderBottomWidth: 1,
    // borderBottomColor: '#333333',
  },
  headerLogo: {
    height: 50,
    width: 100,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filterIconBtn: {
    width: 38,
    height: 38,
 
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BRAND,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: '#333333',
  },
  headerAvatarFallback: {
    backgroundColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Filter chips
  filterBar: {
    backgroundColor: '#121212',
    // borderBottomWidth: 1,
    // borderBottomColor: '#333333',
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
    borderRadius: 10,
    backgroundColor: '#1E1E1E',
    borderWidth: 1.5,
    borderColor: 'transparent',
    marginRight: 8,
  },
  typeChipOffset: {
    marginLeft: 10,
  },
  filterChipActive: {
    backgroundColor: '#fff',
  },
  filterChipText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSansMedium',
    color: '#9CA3AF',
  },
  filterChipTextActive: {
    color: "#121212",
    fontFamily: 'PlusJakartaSansBold',
  },

  // Type tabs (profile-style)
  typeTabBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10
  },
  typeTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  typeTabActive: {
    borderBottomColor: '#fff',
  },
  typeTabText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSansBold',
    color: '#9CA3AF',
  },
  typeTabTextActive: {
    color: '#E5E5E5',
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
    color: '#E5E5E5',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans',
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 12, // Reduced to accommodate the highlighted city
  },
  // New: Highlighted city container
  cityHighlightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor: '#F0F8FF', // Light blue background for highlight
    borderRadius: 10, // Pill shape
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 24,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
    // elevation: 2, // For Android shadow
  },
  cityIcon: {
    marginRight: 8,
  },
  cityHighlightText: {
    fontSize: 28, // Bigger font for emphasis
    fontFamily: 'PlusJakartaSansBold',
    color: colors.primary, // Use primary color for prominence
    textTransform: 'capitalize', // Capitalize city name
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: BRAND,
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 10,
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
    padding: 15,
    borderRadius: 50,
    backgroundColor: colors.primary,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 6 },
    // shadowOpacity: 0.2,
    // shadowRadius: 10,
    // elevation: 10,
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