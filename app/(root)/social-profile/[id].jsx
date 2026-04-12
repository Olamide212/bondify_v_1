/**
 * app/(root)/social-profile/[id].jsx
 *
 * Displays another user's social / bondup profile.
 * Supports follow / unfollow.
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Grid3x3,
  MoreVertical,
  UserCheck,
  UserPlus,
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
import { useAlert } from '../../../context/AlertContext';
import feedService from '../../../services/feedService';

const BRAND = colors.primary;

const avatarUrl = (user) =>
  user?.profilePhoto || user?.images?.[0]?.url || user?.images?.[0] || null;

const getFullName = (user) =>
  [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'User';

export default function SocialProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { showAlert } = useAlert();
  const { user: currentUser } = useSelector((s) => s.auth);

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const isOwnProfile = String(id) === String(currentUser?._id);

  const loadProfile = async () => {
    if (!id) return;
    setError(false);
    try {
      const [profileRes, followRes] = await Promise.all([
        feedService.getUserProfile(id),
        feedService.checkFollowStatus(id),
      ]);

      const userData = profileRes?.data ?? profileRes?.user ?? profileRes;
      const userPosts = profileRes?.posts ?? [];
      setProfile(userData);
      setPosts(Array.isArray(userPosts) ? userPosts : []);
      setIsFollowing(followRes?.isFollowing ?? false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [id]);

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
      const profileRes = await feedService.getUserProfile(id);
      const userData = profileRes?.data ?? profileRes?.user ?? profileRes;
      setProfile(userData);
    } catch {
      setIsFollowing(wasFollowing);
      showAlert({
        icon: 'error',
        title: 'Error',
        message: 'Could not update follow status.',
        actions: [{ label: 'OK', style: 'primary' }],
      });
    } finally {
      setFollowLoading(false);
    }
  };

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
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color={BRAND} />
        </View>
      </SafeAreaView>
    );
  }

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
        <View style={s.loadingContainer}>
          <Text style={{ fontSize: 16, color: '#888', textAlign: 'center', fontFamily: 'PlusJakartaSansMedium' }}>
            Could not load profile.{'\n'}Please try again.
          </Text>
          <TouchableOpacity onPress={() => { setLoading(true); loadProfile(); }} style={{ marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: BRAND, borderRadius: 12 }}>
            <Text style={{ color: '#fff', fontFamily: 'PlusJakartaSansBold', fontSize: 14 }}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const stats = {
    posts: profile?.postsCount ?? posts.length ?? 0,
    followers: profile?.followersCount ?? profile?.followers?.length ?? 0,
    following: profile?.followingCount ?? profile?.following?.length ?? 0,
  };

  const userAv = avatarUrl(profile);
  const userName = profile?.socialProfile?.userName
    ? `@${profile.socialProfile.userName}`
    : null;

  const renderPost = ({ item }) => {
    const media = item.mediaUrls?.[0] || item.media?.[0]?.url;
    return (
      <View style={s.postThumb}>
        {media ? (
          <Image source={{ uri: media }} style={s.postThumbImage} />
        ) : (
          <View style={s.postThumbText}>
            <Text style={s.postThumbTextContent} numberOfLines={4}>
              {item.content || ''}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} hitSlop={10}>
          <ArrowLeft size={22} color="#333" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Profile</Text>
        <TouchableOpacity style={s.backBtn} hitSlop={10}>
          <MoreVertical size={20} color="#555" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item, i) => item._id || String(i)}
        numColumns={2}
        renderItem={renderPost}
        columnWrapperStyle={s.postsRow}
        contentContainerStyle={s.postsContent}
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

            {/* Name + username */}
            <View style={s.nameSection}>
              <Text style={s.fullName}>{getFullName(profile)}</Text>
              {!!userName && <Text style={s.userName}>{userName}</Text>}
              {!!profile?.socialProfile?.bio && (
                <Text style={s.bio}>{profile.socialProfile.bio}</Text>
              )}
            </View>

            {/* Stats row */}
            <View style={s.statsRow}>
              <View style={s.statItem}>
                <Text style={s.statNumber}>{stats.posts}</Text>
                <Text style={s.statLabel}>Posts</Text>
              </View>
              <View style={s.statDivider} />
              <View style={s.statItem}>
                <Text style={s.statNumber}>{stats.followers}</Text>
                <Text style={s.statLabel}>Followers</Text>
              </View>
              <View style={s.statDivider} />
              <View style={s.statItem}>
                <Text style={s.statNumber}>{stats.following}</Text>
                <Text style={s.statLabel}>Following</Text>
              </View>
            </View>

            {/* Follow button */}
            {!isOwnProfile && (
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

            {/* Posts grid header */}
            {posts.length > 0 && (
              <View style={s.postsHeader}>
                <Grid3x3 size={18} color={BRAND} />
                <Text style={s.postsHeaderText}>Posts</Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={s.emptyPosts}>
            <Text style={s.emptyPostsEmoji}>📭</Text>
            <Text style={s.emptyPostsText}>No posts yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: '#1E1E1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: 'PlusJakartaSansBold',
    color: '#E5E5E5',
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

  // Name
  nameSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  fullName: {
    fontSize: 22,
    fontFamily: 'PlusJakartaSansBold',
    color: '#E5E5E5',
    marginBottom: 4,
  },
  userName: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSansMedium',
    color: '#888',
    marginBottom: 6,
  },
  bio: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans',
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
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
    color: '#E5E5E5',
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
    backgroundColor: '#121212',
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

  // Posts
  postsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    marginBottom: 2,
  },
  postsHeaderText: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSansBold',
    color: '#E5E5E5',
  },
  postsContent: {
    paddingBottom: 40,
  },
  postsRow: {
    gap: 2,
    paddingHorizontal: 2,
  },
  postThumb: {
    flex: 1,
    aspectRatio: 1,
    margin: 1,
    backgroundColor: '#1E1E1E',
    overflow: 'hidden',
  },
  postThumbImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  postThumbText: {
    flex: 1,
    padding: 8,
    justifyContent: 'center',
  },
  postThumbTextContent: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans',
    color: '#D1D5DB',
  },

  emptyPosts: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyPostsEmoji: { fontSize: 40, marginBottom: 12 },
  emptyPostsText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans',
    color: '#888',
  },
});
