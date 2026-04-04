/**
 * User Feed Profile Screen  —  app/(root)/user-feed-profile/[id].jsx
 *
 * Displays another user's feed profile:
 *  • Header with back button
 *  • Profile avatar, name, followers/following count
 *  • Tabs: Posts | Comments | Likes
 *  • Horizontal scrollable posts/comments/likes
 *  • Follow button
 *  • Messaging button
 */

import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, MessageCircle, UserPlus, UserX } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import VerifiedIcon from "../../../components/ui/VerifiedIcon";
import { colors } from "../../../constant/colors";
import { useAlert } from "../../../context/AlertContext";
import feedService from "../../../services/feedService";

const BRAND = colors.primary;

const avatarUrl = (user) =>
  user?.profilePhoto || user?.images?.[0]?.url || user?.images?.[0] || null;

const displayName = (user) =>
  [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.userName || "User";

// ─── Post/Comment Card for horizontal list ───────────────────────────────────
const HorizontalPostCard = ({ item, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.horizontalCard}
      onPress={() => onPress(item)}
      activeOpacity={0.75}
    >
      {item.mediaUrl ? (
        <Image source={{ uri: item.mediaUrl }} style={styles.horizontalMedia} />
      ) : (
        <View style={[styles.horizontalMedia, styles.noMediaBg]} />
      )}
      <View style={styles.horizontalContent}>
        <Text style={styles.horizontalText} numberOfLines={3}>
          {item.content || "..."}
        </Text>
        <View style={styles.horizontalMeta}>
          <Text style={styles.metaLabel}>❤️ {item.likesCount ?? 0}</Text>
          <Text style={styles.metaLabel}>💬 {item.commentsCount ?? 0}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────
export default function UserFeedProfile() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { showAlert } = useAlert();
  const { user: currentUser } = useSelector((s) => s.auth);

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [likes, setLikes] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");

  // Load user's feed profile and posts
  useEffect(() => {
    const loadProfile = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const profileRes = await feedService.getUserProfile(id).catch(() => null);
        const postsRes = await feedService.getUserPosts(id).catch(() => null);
        const commentsRes = await feedService.getUserComments(id).catch(() => null);
        const likesRes = await feedService.getUserLikes(id).catch(() => null);
        const followRes = await feedService.checkFollowStatus(id).catch(() => null);

        if (profileRes?.data) setProfile(profileRes.data);
        if (postsRes?.data) setPosts(postsRes.data);
        if (commentsRes?.data) setComments(commentsRes.data);
        if (likesRes?.data) setLikes(likesRes.data);
        if (followRes?.data) setIsFollowing(followRes.data.isFollowing ?? false);
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [id]);

  // Toggle follow
  const handleToggleFollow = async () => {
    if (!id) return;
    setFollowing(true);
    try {
      if (isFollowing) {
        await feedService.unfollowUser(id);
      } else {
        await feedService.followUser(id);
      }
      setIsFollowing(!isFollowing);
    } catch (err) {
      showAlert({
        icon: 'error',
        title: 'Error',
        message: err?.response?.data?.message ?? 'Failed to update follow status',
        actions: [{ label: 'OK', style: 'primary' }],
      });
    } finally {
      setFollowing(false);
    }
  };

  // Navigate to messaging
  const handleMessage = () => {
    if (profile?.userId) {
      router.push(`/chat/${profile.userId}`);
    }
  };

  const isOwnProfile = currentUser?._id === id;

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ActivityIndicator size="large" color={BRAND} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color="#111" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Profile not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const profileAvatar = avatarUrl(profile);
  const tabData = {
    posts,
    comments,
    likes,
  };
  const activeData = tabData[activeTab] || [];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{displayName(profile)}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Banner */}
        <View style={styles.profileBanner}>
          {profileAvatar ? (
            <Image source={{ uri: profileAvatar }} style={styles.profileAvatar} />
          ) : (
            <View style={[styles.profileAvatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitial}>
                {displayName(profile)?.[0]?.toUpperCase()}
              </Text>
            </View>
          )}

          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.profileName}>{displayName(profile)}</Text>
              {profile.isVerified && <VerifiedIcon style={{ marginLeft: 8 }} />}
            </View>
            {profile?.userName && (
              <Text style={styles.profileHandle}>@{profile.userName}</Text>
            )}
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile.followersCount ?? 0}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile.followingCount ?? 0}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile.likesCount ?? 0}</Text>
            <Text style={styles.statLabel}>Likes</Text>
          </View>
        </View>

        {/* Bio/Location if available */}
        {profile.bio && (
          <View style={styles.bioSection}>
            <Text style={styles.bioText}>{profile.bio}</Text>
          </View>
        )}

        {/* Action Buttons */}
        {!isOwnProfile && (
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={[styles.actionButton, isFollowing && styles.followingButton]}
              onPress={handleToggleFollow}
              disabled={following}
            >
              {isFollowing ? (
                <>
                  <UserX size={18} color={BRAND} />
                  <Text style={[styles.actionButtonText, { color: BRAND }]}>Unfollow</Text>
                </>
              ) : (
                <>
                  <UserPlus size={18} color="#fff" />
                  <Text style={styles.actionButtonText}>Follow</Text>
                </>
              )}
            </TouchableOpacity>

            {/* <TouchableOpacity
              style={styles.messageButton}
              onPress={handleMessage}
            >
              <MessageCircle size={18} color="#fff" />
              <Text style={styles.actionButtonText}>Message</Text>
            </TouchableOpacity> */}
          </View>
        )}

        {/* Tabs */}
        <View style={styles.tabRow}>
          {["posts", "comments", "likes"].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Horizontal Scrolling List */}
        {activeData.length > 0 ? (
          <View style={styles.horizontalListContainer}>
            <FlatList
              data={activeData}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalListContent}
              renderItem={({ item }) => (
                <HorizontalPostCard item={item} onPress={() => {}} />
              )}
              keyExtractor={(item, idx) => `${item._id}-${idx}`}
              scrollEventThrottle={16}
            />
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              No {activeTab} yet
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "OutfitBold",
    color: '#E5E5E5',
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#999",
    fontFamily: "Outfit",
  },

  // Profile Section
  profileBanner: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  profileAvatar: {
    width: 70,
    height: 70,
    borderRadius: 50,
    backgroundColor: '#1E1E1E',
  },
  avatarFallback: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: BRAND,
  },
  avatarInitial: {
    fontSize: 20,
    fontFamily: "OutfitBold",
    color: "#fff",
  },
  profileInfo: {
    flex: 1,
    justifyContent: "center",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  profileName: {
    fontSize: 20,
    fontFamily: "OutfitBold",
    color: '#E5E5E5',
  },
  profileHandle: {
    fontSize: 13,
    fontFamily: "Outfit",
    color: "#888",
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    marginHorizontal: 16,
  },
  statItem: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 18,
    fontFamily: "OutfitBold",
    color: '#E5E5E5',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Outfit",
    color: "#888",
    marginTop: 4,
  },

  // Bio
  bioSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bioText: {
    fontSize: 14,
    fontFamily: "Outfit",
    color: '#9CA3AF',
    lineHeight: 20,
  },

  // Action Buttons
  actionButtonsRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    marginVertical: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: BRAND,
    borderRadius: 20,
    paddingVertical: 12,
  },
  followingButton: {
    backgroundColor: '#1E1E1E',
  },
  messageButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: BRAND,
    borderRadius: 20,
    paddingVertical: 12,
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: "OutfitBold",
    color: "#fff",
  },

  // Tabs
  tabRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    marginHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: BRAND,
  },
  tabText: {
    fontSize: 14,
    fontFamily: "OutfitMedium",
    color: "#888",
  },
  tabTextActive: {
    color: BRAND,
    fontFamily: "OutfitBold",
  },

  // Horizontal List
  horizontalListContainer: {
    paddingVertical: 12,
  },
  horizontalListContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  horizontalCard: {
    width: 180,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    overflow: "hidden",
  },
  horizontalMedia: {
    width: "100%",
    height: 140,
    backgroundColor: "#e0e0e0",
  },
  noMediaBg: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: '#1E1E1E',
  },
  horizontalContent: {
    padding: 10,
  },
  horizontalText: {
    fontSize: 12,
    fontFamily: "Outfit",
    color: '#D1D5DB',
    marginBottom: 8,
  },
  horizontalMeta: {
    flexDirection: "row",
    gap: 8,
  },
  metaLabel: {
    fontSize: 11,
    fontFamily: "Outfit",
    color: "#888",
  },

  // Empty State
  emptyState: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Outfit",
    color: "#ccc",
  },
});
