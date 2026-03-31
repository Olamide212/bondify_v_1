/**
 * Bondup User Profile Screen  —  app/(root)/bondup-profile/[id].jsx
 *
 * Displays a bondup participant's profile with friend-based interactions:
 *   • First name + location
 *   • Friend request button (standalone at top)
 *   • Three tabs: Bondups, Friends, Mutual Friends
 *   • Social bio
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  MapPin,
  Plus,
} from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import BondupsTab from '../../../components/bondup/bondup-profile/BondupsTab';
import FriendActionButton from '../../../components/bondup/bondup-profile/FriendActionButton';
import FriendRequestsModal from '../../../components/bondup/bondup-profile/FriendRequestsModal';
import FriendsTab from '../../../components/bondup/bondup-profile/FriendsTab';
import MutualFriendsTab from '../../../components/bondup/bondup-profile/MutualFriendsTab';
import ProfileTabs from '../../../components/bondup/bondup-profile/ProfileTabs';
import CreateBondupModal from '../../../components/bondup/CreateBondupModal';
import { colors } from '../../../constant/colors';
import bondupService from '../../../services/bondupService';
import profileService from '../../../services/profileService';

const BRAND = colors.primary;

const avatarUrl = (user) =>
  user?.profilePhoto || user?.images?.[0]?.url || user?.images?.[0] || null;

const getFullName = (user) => {
  const firstName = user?.firstName || '';
  const lastName = user?.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName || user?.userName || 'User';
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function BondupProfileScreen() {
  const router = useRouter();
  const { id, chatId } = useLocalSearchParams();
  const { user: currentUser } = useSelector((s) => s.auth);

  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ followersCount: 0, followingCount: 0, bondups: 0 });
  const [activeBondups, setActiveBondups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [friendStatus, setFriendStatus] = useState('none');
  const [friendRequestLoading, setFriendRequestLoading] = useState(false);
  const [friends, setFriends] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [mutualFriends, setMutualFriends] = useState([]);
  const [mutualFriendsLoading, setMutualFriendsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('bondups'); // 'bondups', 'friends', 'mutual'
  const [refreshing, setRefreshing] = useState(false);
  const [showFriendRequests, setShowFriendRequests] = useState(false);
  const [showCreateBondup, setShowCreateBondup] = useState(false);

  const isOwnProfile = String(id) === String(currentUser?._id);

  const loadMutualFriends = useCallback(async () => {
    if (!id || isOwnProfile) return;
    setMutualFriendsLoading(true);
    try {
      const res = await bondupService.getMutualFriends(id);
      if (res?.data) {
        setMutualFriends(res.data);
      }
    } catch {
      // silent
    } finally {
      setMutualFriendsLoading(false);
    }
  }, [id, isOwnProfile]);

  const loadFriends = useCallback(async () => {
    if (!id) return;
    setFriendsLoading(true);
    try {
      const res = await bondupService.getFriends(id);
      if (res?.data) {
        setFriends(res.data);
      }
    } catch {
      // silent
    } finally {
      setFriendsLoading(false);
    }
  }, [id]);

  const loadProfile = useCallback(async () => {
    if (!id) return;
    setError(false);
    try {
      // Handle current user's own profile
      if (isOwnProfile && currentUser) {
        // Use the same bondup profile endpoint for consistency
        try {
          const res = await bondupService.getBondupProfile(id);
          if (res?.data) {
            setProfile(res.data.user);
            setStats(res.data.stats || {});
            setActiveBondups(res.data.activeBondups || []);
            setFriendStatus('none'); // Can't be friends with yourself
            await loadFriends();
            return;
          }
        } catch {
          // Fall back to current user data
          setProfile(currentUser);
          setStats({
            followersCount: currentUser.followersCount || 0,
            followingCount: currentUser.followingCount || 0,
            bondups: currentUser.bondupCount || 0,
            bio: currentUser.bio || currentUser.socialBio || '',
          });
          setFriendStatus('none');
          await loadFriends();
          return;
        }
      }

      let loaded = false;

      // Primary: bondup profile endpoint (no chatId needed)
      try {
        const res = await bondupService.getBondupProfile(id);
        if (res?.data) {
          setProfile(res.data.user);
          setStats(res.data.stats || {});
          setActiveBondups(res.data.activeBondups || []);
          setFriendStatus(res.data.friendStatus || 'none');
          loaded = true;
        }
      } catch {
        // Falls through to generic profile endpoint
      }

      // Fallback: use profileService
      if (!loaded) {
        try {
          const profileData = await profileService.getProfileById(id);
          if (profileData) {
            setProfile(profileData);
            setStats({
              followersCount: profileData.followersCount || 0,
              followingCount: profileData.followingCount || 0,
              bondups: profileData.bondupCount || 0,
              bio: profileData.bio || profileData.socialBio || '',
            });
            setActiveBondups([]);
          } else {
            setError(true);
          }
        } catch {
          setError(true);
        }

        // Check friend status separately when using fallback
        const friendStatusRes = await bondupService.getFriendStatus(id).catch(() => ({ data: { status: 'none' } }));
        setFriendStatus(friendStatusRes?.data?.status || 'none');
      }

      // Load friends data
      await loadFriends();
      await loadMutualFriends();
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, isOwnProfile, currentUser, loadFriends, loadMutualFriends]);

  useEffect(() => {
    loadProfile();
  }, [id, chatId, loadProfile]);

  // Handle tab switching when viewing other users' profiles
  useEffect(() => {
    if (!isOwnProfile && activeTab === 'friends') {
      setActiveTab('bondups');
    }
  }, [isOwnProfile, activeTab]);

  const onRefresh = () => {
    setRefreshing(true);
    loadProfile();
  };

  const handleFriendRequest = async () => {
    if (isOwnProfile) return;
    setFriendRequestLoading(true);
    try {
      if (friendStatus === 'none') {
        await bondupService.sendFriendRequest(id);
        setFriendStatus('request_sent');
      }
      // For other states, we might want to show different actions
      // but for now, only handle sending requests
    } catch {
      // silent
    } finally {
      setFriendRequestLoading(false);
    }
  };

  const handleEditProfile = () => {
    router.push('/profile?tab=social');
  };

  const handleBondupUpdate = (updatedBondup, bondupId) => {
    if (bondupId && !updatedBondup) {
      // Bondup was deleted
      setActiveBondups(prev => prev.filter(b => b._id !== bondupId));
    } else if (updatedBondup) {
      // Bondup was updated
      setActiveBondups(prev => prev.map(b => b._id === updatedBondup._id ? updatedBondup : b));
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn} hitSlop={10}>
            <ArrowLeft size={22} color="#333" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Profile</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color={BRAND} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error || !profile) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn} hitSlop={10}>
            <ArrowLeft size={22} color="#333" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Profile</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={s.loadingWrap}>
          <Text style={s.errorText}>Could not load profile.</Text>
          <TouchableOpacity
            onPress={() => { setLoading(true); loadProfile(); }}
            style={s.retryBtn}
          >
            <Text style={s.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const userAv = avatarUrl(profile);

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} hitSlop={10}>
          <ArrowLeft size={22} color="#333" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Profile</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[BRAND]} tintColor={BRAND} />
        }
      >
        {/* Avatar */}
        <View style={s.avatarSection}>
          {userAv ? (
            <Image source={{ uri: userAv }} style={s.avatar} />
          ) : (
            <View style={[s.avatar, s.avatarFallback]}>
              <Text style={s.avatarInitial}>
                {getFullName(profile)[0].toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* Name + Location */}
        <View style={s.nameSection}>
          <Text style={s.fullName}>{getFullName(profile)}</Text>
          {!!profile.city && (
            <View style={s.locationRow}>
              <MapPin size={14} color="#888" />
              <Text style={s.locationText}>{profile.city}</Text>
            </View>
          )}
          {!!stats.bio && <Text style={s.bio}>{stats.bio}</Text>}
        </View>

        {/* Friend Action Button - Standalone */}
        <FriendActionButton
          friendStatus={friendStatus}
          onSendRequest={handleFriendRequest}
          onShowRequests={() => setShowFriendRequests(true)}
          onEditProfile={handleEditProfile}
          loading={friendRequestLoading}
          isOwnProfile={isOwnProfile}
        />

        {/* Tab Navigation */}
        <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} isOwnProfile={isOwnProfile} />

        {/* Tab Content */}
        {activeTab === 'bondups' && (
          <BondupsTab 
            bondups={activeBondups} 
            loading={false} 
            currentUserId={currentUser?._id}
            onBondupUpdate={handleBondupUpdate}
          />
        )}
        {activeTab === 'friends' && (
          <FriendsTab friends={friends} loading={friendsLoading} />
        )}
        {activeTab === 'mutual' && (
          <MutualFriendsTab mutualFriends={mutualFriends} loading={mutualFriendsLoading} />
        )}
      </ScrollView>

      {/* Floating Action Button - Only for current user */}
      {isOwnProfile && (
        <TouchableOpacity
          style={s.fab}
          onPress={() => setShowCreateBondup(true)}
          activeOpacity={0.8}
        >
          <Plus size={24} color="#fff" />
        </TouchableOpacity>
      )}

      <FriendRequestsModal
        visible={showFriendRequests}
        onClose={() => setShowFriendRequests(false)}
      />

      <CreateBondupModal
        visible={showCreateBondup}
        onClose={() => setShowCreateBondup(false)}
        onCreated={(newBondup) => {
          // Refresh the bondups list when a new bondup is created
          loadProfile();
          setShowCreateBondup(false);
        }}
      />
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSansMedium',
    color: '#888',
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: BRAND,
    borderRadius: 12,
  },
  retryBtnText: {
    color: '#fff',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: 14,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: 'PlusJakartaSansBold',
    color: '#111',
  },

  scrollContent: {
    paddingBottom: 40,
  },

  // Tab Content
  tabContent: {
    flex: 1,
    minHeight: 200,
  },

  // Friend Button (in tab)
  friendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: BRAND,
    marginHorizontal: 32,
    paddingVertical: 13,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  friendsBtn: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: BRAND,
    shadowOpacity: 0,
    elevation: 0,
  },
  requestSentBtn: {
    backgroundColor: '#FFA500',
    shadowOpacity: 0,
    elevation: 0,
  },
  friendBtnText: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSansBold',
    color: '#fff',
  },
  friendsBtnText: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSansBold',
    color: BRAND,
  },

  // Bondups by day
  daySection: {
    marginBottom: 16,
  },
  dayLabel: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSansBold',
    color: '#111',
    marginHorizontal: 16,
    marginBottom: 8,
  },

  // Empty states
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans',
    color: '#888',
  },

  // Avatar
  avatarSection: {
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 12,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: `${BRAND}40`,
  },
  avatarFallback: {
    backgroundColor: BRAND,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 34,
    fontFamily: 'PlusJakartaSansBold',
  },

  // Name + Location
  nameSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  fullName: {
    fontSize: 22,
    fontFamily: 'PlusJakartaSansBold',
    color: '#111',
    marginBottom: 6,
    textTransform: 'capitalize',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSansMedium',
    color: '#888',
  },
  bio: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans',
    color: '#555',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 4,
  },

  // Section
  sectionHeader: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSansBold',
    color: '#111',
  },

  // Active bondup card
  bondupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  bondupEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  bondupCardContent: {
    flex: 1,
  },
  bondupTitle: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSansBold',
    color: '#111',
    marginBottom: 3,
  },
  bondupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bondupMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  bondupMetaText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans',
    color: '#888',
  },
  bondupParticipants: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  bondupParticipantCount: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSansBold',
    color: '#666',
  },

  // Empty
  emptyBondups: {
    alignItems: 'center',
    paddingVertical: 40,
  },

  // Floating Action Button
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: BRAND,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
