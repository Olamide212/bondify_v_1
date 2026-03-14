/**
 * BonFeed Screen  —  app/(root)/(tab)/feed/index.jsx
 *
 * Features:
 *  • Header with app brand + profile avatar placeholder (opens profile sheet)
 *  • Tab bar: "For You" | "New" | "Following"
 *  • Infinite-scrolling post list
 *  • Clickable posts → PostDetailModal (Twitter-like)
 *  • 3-dots menu → PostOptionsModal (Share, Save, Follow, Mute, Report, Block)
 *  • Create-post FAB → CreatePostModal (full-screen BaseModal)
 *  • FeedProfileSheet (social profile bottom-sheet)
 */

import { Plus, User } from "lucide-react-native";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import CreatePostModal from "../../../../components/feed/CreatePostModal";
import FeedPostCard from "../../../../components/feed/FeedPostCard";
import FeedProfileSheet from "../../../../components/feed/FeedProfileSheet";
import PostDetailModal from "../../../../components/feed/PostDetailModal";
import PostOptionsModal from "../../../../components/feed/PostOptionsModal";
import { colors } from "../../../../constant/colors";
import feedService from "../../../../services/feedService";
import {images} from "../../../../constant/images"

const BRAND = colors.primary;
const TABS = ["For You", "New", "Following"];
const TAB_KEYS = ["foryou", "new", "following"];

// ─── helpers ──────────────────────────────────────────────────────────────────
const avatar = (user) =>
  user?.profilePhoto || user?.images?.[0]?.url || user?.images?.[0] || null;

const displayName = (user) =>
  [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.userName || "User";

// ─── BonFeed Screen ─────────────────────────────────────────────────────────────
export default function BonFeed() {
  const { user: currentUser } = useSelector((s) => s.auth);

  const [activeTab, setActiveTab] = useState(0);
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Post detail modal
  const [detailPost, setDetailPost] = useState(null);

  // Post options modal
  const [optionsPost, setOptionsPost] = useState(null);

  // ── Follow cache (authorId -> isFollowing) shared across cards ──────────
  const followCache = useRef({});
  const requestIdRef = useRef(0);

  // ── Load posts ──────────────────────────────────────────────────────────────
  const loadPosts = useCallback(
    async (tabIndex = activeTab, pg = 1, append = false) => {
      const requestId = ++requestIdRef.current;
      setLoading(true);
      try {
        const res = await feedService.getFeed({ tab: TAB_KEYS[tabIndex], page: pg, limit: 20 });
        if (requestId !== requestIdRef.current) return;
        const newPosts = (res.data ?? []).map((p) => ({
          ...p,
          _isFollowing: followCache.current[p.author?._id] ?? false,
        }));
        setPosts((prev) => (append ? [...prev, ...newPosts] : newPosts));
        setHasMore(res.pagination?.hasMore ?? false);
        setPage(pg);
      } catch {
        // silent fail — network errors are expected on mobile
      } finally {
        if (requestId === requestIdRef.current) setLoading(false);
      }
    },
    [activeTab]
  );

  useEffect(() => {
    loadPosts(activeTab, 1, false);
  }, [activeTab]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPosts(activeTab, 1, false);
    setRefreshing(false);
  };

  const onEndReached = () => {
    if (!loading && hasMore) loadPosts(activeTab, page + 1, true);
  };

  // ── Like ────────────────────────────────────────────────────────────────────
  const handleLike = async (postId) => {
    const prev = posts.find((p) => p._id === postId);
    const update = (all) =>
      all.map((p) =>
        p._id === postId
          ? {
              ...p,
              isLiked: !p.isLiked,
              likesCount: p.isLiked ? (p.likesCount ?? 1) - 1 : (p.likesCount ?? 0) + 1,
            }
          : p
      );
    setPosts(update);
    // Also update detail modal if open
    setDetailPost((d) => (d?._id === postId ? update([d])[0] : d));
    try {
      await feedService.toggleLike(postId);
    } catch {
      if (prev) {
        setPosts((all) => all.map((p) => (p._id === postId ? prev : p)));
        setDetailPost((d) => (d?._id === postId ? prev : d));
      }
    }
  };

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async (postId) => {
    const prev = posts.find((p) => p._id === postId);
    const update = (all) =>
      all.map((p) =>
        p._id === postId
          ? { ...p, isSaved: !p.isSaved, savesCount: p.isSaved ? (p.savesCount ?? 1) - 1 : (p.savesCount ?? 0) + 1 }
          : p
      );
    setPosts(update);
    setDetailPost((d) => (d?._id === postId ? update([d])[0] : d));
    try {
      await feedService.toggleSave(postId);
    } catch {
      if (prev) {
        setPosts((all) => all.map((p) => (p._id === postId ? prev : p)));
        setDetailPost((d) => (d?._id === postId ? prev : d));
      }
    }
  };

  // ── Follow ──────────────────────────────────────────────────────────────────
  const handleFollow = async (authorId) => {
    const prevFollowing = followCache.current[authorId] ?? false;
    const nextFollowing = !prevFollowing;
    followCache.current[authorId] = nextFollowing;
    const updateFollowState = (following) => {
      setPosts((all) =>
        all.map((p) =>
          String(p.author?._id) === String(authorId) ? { ...p, _isFollowing: following } : p
        )
      );
      setDetailPost((d) =>
        d && String(d.author?._id) === String(authorId) ? { ...d, _isFollowing: following } : d
      );
    };
    updateFollowState(nextFollowing);
    try {
      const res = await feedService.toggleFollow(authorId);
      const confirmed = res.data?.following ?? nextFollowing;
      followCache.current[authorId] = confirmed;
      updateFollowState(confirmed);
    } catch {
      followCache.current[authorId] = prevFollowing;
      updateFollowState(prevFollowing);
    }
  };

  // ── Share ───────────────────────────────────────────────────────────────────
  const handleShare = async (postId) => {
    const post = posts.find((p) => p._id === postId) || detailPost;
    if (!post) return;
    try {
      const content = post.content?.substring(0, 100) + (post.content?.length > 100 ? "…" : "");
      await Share.share({
        message: `Check out this post by ${displayName(post.author)} on BonFeed:\n\n"${content}"`,
      });
    } catch {}
  };

  // ── Comment Like ────────────────────────────────────────────────────────────
  const handleCommentLike = async (postId, commentId) => {
    try {
      await feedService.toggleCommentLike(postId, commentId);
      // Optimistically toggle the comment like in detail modal
      setDetailPost((d) => {
        if (!d || d._id !== postId) return d;
        return {
          ...d,
          comments: (d.comments ?? []).map((c) =>
            c._id === commentId
              ? {
                  ...c,
                  isLiked: !c.isLiked,
                  likesCount: c.isLiked ? (c.likesCount ?? 1) - 1 : (c.likesCount ?? 0) + 1,
                }
              : c
          ),
        };
      });
    } catch {}
  };

  // ── Comment ─────────────────────────────────────────────────────────────────
  const handleSubmitComment = async (postId, content, parentId = null) => {
    try {
      const res = await feedService.addComment(postId, content, parentId);
      const updater = (p) =>
        p._id === postId
          ? {
              ...p,
              comments: [...(p.comments ?? []), res.data],
              commentsCount: (p.commentsCount ?? 0) + 1,
            }
          : p;
      setPosts((prev) => prev.map(updater));
      setDetailPost((d) => (d?._id === postId ? updater(d) : d));
    } catch {}
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = (postId) => {
    Alert.alert("Delete Post", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setPosts((prev) => prev.filter((p) => p._id !== postId));
          setDetailPost((d) => (d?._id === postId ? null : d));
          try {
            await feedService.deletePost(postId);
          } catch {}
        },
      },
    ]);
  };

  // ── Post created ────────────────────────────────────────────────────────────
  const handlePostCreated = (newPost) => {
    setPosts((prev) => [
      { ...newPost, isLiked: false, isSaved: false, _isFollowing: false },
      ...prev,
    ]);
  };

  // ── Post card press (open detail) ───────────────────────────────────────────
  const handlePostPress = (post) => {
    setDetailPost(post);
  };

  // ── 3-dots menu options ─────────────────────────────────────────────────────
  const handleOpenOptions = (post) => {
    // If the delete comes from the detail modal, close it first
    if (post?._deleteFromDetail) {
      setDetailPost(null);
      handleDelete(post._id);
      return;
    }
    setOptionsPost(post);
  };

  const handleOptionSelect = (key) => {
    if (!optionsPost) return;
    const post = optionsPost;
    const authorId = post.author?._id ?? post.author;

    switch (key) {
      case "share":
        handleShare(post._id);
        break;
      case "save":
        handleSave(post._id);
        break;
      case "follow":
        handleFollow(authorId);
        break;
      case "mute":
        Alert.alert("Muted", "You won't see posts from this user.");
        break;
      case "report":
        Alert.alert("Report", "This post has been reported.");
        break;
      case "block":
        Alert.alert("Block", "This user has been blocked.");
        break;
      case "delete":
        handleDelete(post._id);
        break;
    }
  };

  // ── Tab press ───────────────────────────────────────────────────────────────
  const handleTabPress = (i) => {
    setActiveTab(i);
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  const userAvatar = avatar(currentUser);

  return (
    <SafeAreaView style={fStyles.container} edges={["top"]}>
      {/* Header */}
      <View style={fStyles.header}>
        <Image source={images.bonFeed} style={{width: 100, height: 40}} resizeMode="contain" />
       
        <TouchableOpacity onPress={() => setShowProfile(true)}>
          {userAvatar ? (
            <Image source={{ uri: userAvatar }} style={fStyles.headerAvatar} />
          ) : (
            <View style={[fStyles.headerAvatar, fStyles.headerAvatarFallback]}>
              <User size={18} color="#fff" />
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Tab bar */}
      <View style={fStyles.tabBar}>
        {TABS.map((t, i) => (
          <TouchableOpacity
            key={t}
            style={[
              fStyles.tabItem,
              activeTab === i ? fStyles.tabItemActive : fStyles.tabItemInactive,
            ]}
            onPress={() => handleTabPress(i)}
          >
            <Text
              style={[
                fStyles.tabLabel,
                activeTab === i ? fStyles.tabLabelActive : fStyles.tabLabelInactive,
              ]}
            >
              {t}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Post list */}
      <FlatList
        data={posts}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <FeedPostCard
            post={item}
            currentUserId={currentUser?._id}
            onLike={handleLike}
            onSave={handleSave}
            onPress={handlePostPress}
            onOpenOptions={handleOpenOptions}
            onShare={handleShare}
          />
        )}
        contentContainerStyle={{ paddingTop: 10, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[BRAND]}
            tintColor={BRAND}
          />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          loading && posts.length > 0 ? (
            <ActivityIndicator size="small" color={BRAND} style={{ marginVertical: 16 }} />
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <View style={fStyles.emptyState}>
              <Text style={fStyles.emptyEmoji}>✨</Text>
              <Text style={fStyles.emptyTitle}>Nothing here yet</Text>
              <Text style={fStyles.emptySub}>
                {activeTab === 2
                  ? "Follow people to see their posts here."
                  : "Be the first to post something!"}
              </Text>
            </View>
          ) : (
            <ActivityIndicator size="large" color={BRAND} style={{ marginTop: 60 }} />
          )
        }
      />

      {/* Create FAB */}
      <TouchableOpacity style={fStyles.fab} onPress={() => setShowCreate(true)}>
        <Plus size={26} color="#fff" />
      </TouchableOpacity>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      <CreatePostModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handlePostCreated}
      />

      <PostDetailModal
        visible={!!detailPost}
        post={detailPost}
        currentUserId={currentUser?._id}
        onClose={() => setDetailPost(null)}
        onLike={handleLike}
        onSave={handleSave}
        onSubmitComment={handleSubmitComment}
        onOpenOptions={handleOpenOptions}
        onFollow={handleFollow}
        isFollowing={detailPost?._isFollowing}
        onShare={handleShare}
        onCommentLike={handleCommentLike}
      />

      <PostOptionsModal
        visible={!!optionsPost}
        onClose={() => setOptionsPost(null)}
        onSelect={handleOptionSelect}
        isFollowing={optionsPost?._isFollowing}
        isSaved={optionsPost?.isSaved}
        isOwnPost={String(optionsPost?.author?._id ?? optionsPost?.author) === String(currentUser?._id)}
      />

      <FeedProfileSheet
        visible={showProfile}
        user={currentUser}
        onClose={() => setShowProfile(false)}
        onUpdate={() => {}}
      />
    </SafeAreaView>
  );
}

const fStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  brand: {
    fontSize: 22,
    fontFamily: "PlusJakartaSansBold",
    color: BRAND,
  },
  headerAvatar: { width: 38, height: 38, borderRadius: 19 },
  headerAvatarFallback: {
    backgroundColor: "#D1D5DB",
    justifyContent: "center",
    alignItems: "center",
  },

  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 99,
  },
  tabItemActive: {
    backgroundColor: "#111",
  },
  tabItemInactive: {
    backgroundColor: "#F0F0F0",
  },
  tabLabel: {
    fontSize: 14,
    fontFamily: "PlusJakartaSansBold",
  },
  tabLabelActive: {
    color: "#fff",
  },
  tabLabelInactive: {
    color: "#333",
  },

  emptyState: { alignItems: "center", paddingTop: 80, paddingHorizontal: 40 },
  emptyEmoji: { fontSize: 44, marginBottom: 12 },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "PlusJakartaSansBold",
    color: "#111",
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans",
    color: "#888",
    textAlign: "center",
    lineHeight: 20,
  },

  fab: {
    position: "absolute",
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: BRAND,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
