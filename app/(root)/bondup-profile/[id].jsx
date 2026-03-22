/**
 * Bondup User Profile Screen  —  app/(root)/bondup-profile/[id].jsx
 *
 * Displays a bondup participant's profile:
 *   • First name + location
 *   • Follow button
 *   • Stats: Followers, Following, Bondups
 *   • Social bio
 *   • Active bondups list
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    ArrowLeft,
    MapPin,
    UserCheck,
    UserPlus,
    Users,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { colors } from '../../../constant/colors';
import bondupService from '../../../services/bondupService';
import feedService from '../../../services/feedService';
import profileService from '../../../services/profileService';

const BRAND = colors.primary;

const avatarUrl = (user) =>
  user?.profilePhoto || user?.images?.[0]?.url || user?.images?.[0] || null;

const getFirstName = (user) =>
  user?.firstName || user?.userName || 'User';

// ─── Bondup Card (compact) ──────────────────────────────────────────────────
const ActiveBondupCard = ({ bondup }) => {
  const emoji = {
    coffee: '☕', food: '🍔', drinks: '🍹', gym: '💪',
    walk: '🚶', movie: '🎬', other: '✨',
  }[bondup.activityType] || '✨';

  const dateLabel = bondup.dateTime
    ? new Date(bondup.dateTime).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <View style={s.bondupCard}>
      <Text style={s.bondupEmoji}>{emoji}</Text>
      <View style={s.bondupCardContent}>
        <Text style={s.bondupTitle} numberOfLines={1}>{bondup.title}</Text>
        <View style={s.bondupMeta}>
          {!!bondup.city && (
            <View style={s.bondupMetaRow}>
              <MapPin size={11} color="#888" />
              <Text style={s.bondupMetaText}>{bondup.city}</Text>
            </View>
          )}
          {!!dateLabel && <Text style={s.bondupMetaText}>{dateLabel}</Text>}
        </View>
      </View>
      <View style={s.bondupParticipants}>
        <Users size={13} color="#888" />
        <Text style={s.bondupParticipantCount}>{bondup.participantCount ?? 0}</Text>
      </View>
    </View>
  );
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
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const isOwnProfile = String(id) === String(currentUser?._id);

  const loadProfile = async () => {
    if (!id) return;
    setError(false);
    try {
      let loaded = false;

      // Primary: bondup profile endpoint (no chatId needed)
      try {
        const res = await bondupService.getBondupProfile(id);
        if (res?.data) {
          setProfile(res.data.user);
          setStats(res.data.stats || {});
          setActiveBondups(res.data.activeBondups || []);
          setIsFollowing(res.data.isFollowing ?? false);
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

        // Check follow status separately when using fallback
        const followRes = await feedService.checkFollowStatus(id).catch(() => null);
        setIsFollowing(followRes?.isFollowing ?? followRes?.data?.isFollowing ?? false);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [id, chatId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadProfile();
  };

  const handleFollowToggle = async () => {
    if (isOwnProfile) return;
    setFollowLoading(true);
    const wasFollowing = isFollowing;
    setIsFollowing(!wasFollowing);
    try {
      if (wasFollowing) {
        await feedService.unfollowUser(id);
      } else {
        await feedService.followUser(id);
      }
      // Refresh stats
      try {
        const res = await bondupService.getBondupProfile(id);
        if (res?.data) {
          setStats(res.data.stats || {});
        }
      } catch {
        // silent
      }
    } catch {
      setIsFollowing(wasFollowing);
    } finally {
      setFollowLoading(false);
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

      <FlatList
        data={activeBondups}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <ActiveBondupCard bondup={item} />}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[BRAND]} tintColor={BRAND} />
        }
        ListHeaderComponent={
          <View>
            {/* Avatar */}
            <View style={s.avatarSection}>
              {userAv ? (
                <Image source={{ uri: userAv }} style={s.avatar} />
              ) : (
                <View style={[s.avatar, s.avatarFallback]}>
                  <Text style={s.avatarInitial}>
                    {(profile?.firstName || 'U')[0].toUpperCase()}
                  </Text>
                </View>
              )}
            </View>

            {/* Name + Location */}
            <View style={s.nameSection}>
              <Text style={s.fullName}>{getFirstName(profile)}</Text>
              {!!profile.city && (
                <View style={s.locationRow}>
                  <MapPin size={14} color="#888" />
                  <Text style={s.locationText}>{profile.city}</Text>
                </View>
              )}
              {!!stats.bio && <Text style={s.bio}>{stats.bio}</Text>}
            </View>

            {/* Stats */}
            <View style={s.statsRow}>
              <View style={s.statItem}>
                <Text style={s.statNumber}>{stats.followersCount ?? 0}</Text>
                <Text style={s.statLabel}>Followers</Text>
              </View>
              <View style={s.statDivider} />
              <View style={s.statItem}>
                <Text style={s.statNumber}>{stats.followingCount ?? 0}</Text>
                <Text style={s.statLabel}>Following</Text>
              </View>
              <View style={s.statDivider} />
              <View style={s.statItem}>
                <Text style={s.statNumber}>{stats.bondups ?? 0}</Text>
                <Text style={s.statLabel}>Bondups</Text>
              </View>
            </View>

            {/* Follow/Edit Profile Button */}
            {isOwnProfile ? (
              <TouchableOpacity
                style={[s.followBtn, { backgroundColor: BRAND }]}
                onPress={() => router.push({ pathname: '/(tab)/profile', params: { tab: 'social' } })}
                activeOpacity={0.85}
              >
                <UserCheck size={16} color={'#fff'} />
                <Text style={s.followBtnText}>Edit Profile</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[s.followBtn, isFollowing && s.followingBtn, followLoading && { opacity: 0.7 }]}
                onPress={handleFollowToggle}
                disabled={followLoading}
                activeOpacity={0.85}
              >
                {followLoading ? (
                  <ActivityIndicator size="small" color={isFollowing ? BRAND : '#fff'} />
                ) : isFollowing ? (
                  <>
                    <UserCheck size={16} color={BRAND} />
                    <Text style={s.followingBtnText}>Following</Text>
                  </>
                ) : (
                  <>
                    <UserPlus size={16} color="#fff" />
                    <Text style={s.followBtnText}>Follow</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* Active Bondups header */}
            {activeBondups.length > 0 && (
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>Active Bondups</Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={s.emptyBondups}>
            <Text style={s.emptyEmoji}>🤝</Text>
            <Text style={s.emptyText}>No active bondups</Text>
          </View>
        }
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

  listContent: {
    paddingBottom: 40,
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

  // Stats
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 32,
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 18,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSansBold',
    color: '#111',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans',
    color: '#888',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E5E7EB',
  },

  // Follow button
  followBtn: {
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
  followingBtn: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: BRAND,
    shadowOpacity: 0,
    elevation: 0,
  },
  followBtnText: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSansBold',
    color: '#fff',
  },
  followingBtnText: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSansBold',
    color: BRAND,
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
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans',
    color: '#888',
  },
});
