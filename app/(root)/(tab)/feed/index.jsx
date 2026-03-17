/**
 * Bondup Feed Screen  —  app/(root)/(tab)/feed/index.jsx
 *
 * Spontaneous meetup posts feed:
 *  • Bonfeed logo in header
 *  • Filter tabs: All, Today, Public, Circle
 *  • Activity filter chips
 *  • List of Bondup cards
 *  • FAB to create a new Bondup
 *  • Real-time socket updates
 *  • Joined / Full / Empty states
 */

import { useRouter } from 'expo-router';
import { Plus, User } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import CreateBondupModal from '../../../../components/bondup/CreateBondupModal';
import { colors } from '../../../../constant/colors';
import { images } from '../../../../constant/images';
import bondupChatService from '../../../../services/bondupChatService';
import bondupService from '../../../../services/bondupService';
import { socketService } from '../../../../services/socketService';

const BRAND = colors.primary;

// ─── Filter config ──────────────────────────────────────────────────────────
const FEED_TABS = ['Join Me', 'I Am Available'];

const ACTIVITY_FILTERS = [
  { key: '', label: 'All' },
  { key: 'coffee', emoji: '☕', label: 'Coffee' },
  { key: 'food',   emoji: '🍔', label: 'Food' },
  { key: 'drinks', emoji: '🍹', label: 'Drinks' },
  { key: 'gym',    emoji: '💪', label: 'Gym' },
  { key: 'walk',   emoji: '🚶', label: 'Walk' },
  { key: 'movie',  emoji: '🎬', label: 'Movie' },
  { key: 'other',  emoji: '✨', label: 'Other' },
];

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
  const [activeTab, setActiveTab] = useState(0); // 0=Join Me, 1=I Am Available
  const [activityFilter, setActivityFilter] = useState('');
  const [detailBondup, setDetailBondup] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const loadRequestRef = useRef(0);

  // ── Load bondups based on active tab ────────────────────────────────────
  const loadBondups = useCallback(async () => {
    const seq = ++loadRequestRef.current;
    setLoading(true);
    try {
      const params = {};
      if (activityFilter) params.activityType = activityFilter;
      // Map tab index to postType
      params.postType = activeTab === 1 ? 'i_am_available' : 'join_me';

      const res = await bondupService.getPublicBondups(params);

      if (seq === loadRequestRef.current) {
        setBondups(res.data ?? []);
      }
    } catch {
      // silent fail
    } finally {
      if (seq === loadRequestRef.current) {
        setLoading(false);
      }
    }
  }, [activeTab, activityFilter]);

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
        setDetailBondup((d) => (d?._id === bondupId ? res.data : d));
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
    // Reload to sync with server and cancel any stale in-flight request
    loadBondups();
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
          pathname: '/chat-screen',
          params: {
            matchId: chatId,
            name: bondup.title,
            isGroupChat: 'true',
            bondupId: bondup._id,
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
        if (prev.some((x) => x._id === b._id)) return prev;
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
          <TouchableOpacity onPress={() => router.push('/feed-profile')}>
            {userAvatar ? (
              <Image source={{ uri: userAvatar }} style={fStyles.headerAvatar} />
            ) : (
              <View style={[fStyles.headerAvatar, fStyles.headerAvatarFallback]}>
                <User size={18} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Tab bar ─────────────────────────────────────────────────────── */}
        <View style={fStyles.tabBar}>
          {FEED_TABS.map((tab, i) => (
            <TouchableOpacity
              key={tab}
              style={[fStyles.tabItem, i === activeTab && fStyles.tabItemActive]}
              onPress={() => setActiveTab(i)}
              activeOpacity={0.7}
            >
              <Text style={[fStyles.tabItemText, i === activeTab && fStyles.tabItemTextActive]}>
                {tab}
              </Text>
              {i === activeTab && <View style={fStyles.tabIndicator} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Activity filter ──────────────────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={fStyles.activityScroller}
        >
          {ACTIVITY_FILTERS.map((a) => (
            <TouchableOpacity
              key={a.key}
              style={[
                fStyles.activityChip,
                activityFilter === a.key && fStyles.activityChipActive,
              ]}
              onPress={() => setActivityFilter(a.key)}
              activeOpacity={0.7}
            >
              {a.emoji && <Text style={fStyles.activityChipEmoji}>{a.emoji}</Text>}
              <Text
                style={[
                  fStyles.activityChipText,
                  activityFilter === a.key && fStyles.activityChipTextActive,
                ]}
              >
                {a.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

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
                {activeTab === 1
                  ? 'No one is available right now.\nBe the first to let others know you\'re free!'
                  : 'Be the first to start a Bondup\nin your city!'}
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
          <Plus size={26} color="#fff" />
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
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// ─── Feed styles ──────────────────────────────────────────────────────────────
const fStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
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
    height: 32,
    width: 120,
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

  // Tabs
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 13,
    position: 'relative',
  },
  tabItemActive: {},
  tabItemText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSansMedium',
    color: '#888',
  },
  tabItemTextActive: {
    color: BRAND,
    fontFamily: 'PlusJakartaSansBold',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '20%',
    right: '20%',
    height: 3,
    borderRadius: 2,
    backgroundColor: BRAND,
  },

  // Activity filter
  activityScroller: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  activityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  activityChipActive: {
    borderColor: BRAND,
    backgroundColor: colors.primaryLight,
  },
  activityChipEmoji: {
    fontSize: 14,
  },
  activityChipText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSansMedium',
    color: '#666',
  },
  activityChipTextActive: {
    color: BRAND,
    fontFamily: 'PlusJakartaSansBold',
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

  // FAB
  fab: {
    position: 'absolute',
    bottom: 50,
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: BRAND,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
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
