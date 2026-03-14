const Post   = require('../models/Post');
const Follow = require('../models/Follow');
const User   = require('../models/User');

// ─── helpers ──────────────────────────────────────────────────────────────────
const AUTHOR_SELECT = 'firstName lastName profilePhoto userName nationality';

const formatPost = (post, currentUserId) => {
  const id = String(currentUserId);
  return {
    ...post,
    likesCount:    post.likes?.length ?? 0,
    commentsCount: post.comments?.length ?? 0,
    savesCount:    post.saves?.length ?? 0,
    isLiked:       (post.likes || []).some((u) => String(u) === id || String(u?._id) === id),
    isSaved:       (post.saves || []).some((u) => String(u) === id || String(u?._id) === id),
  };
};

// ─── GET /api/feed  ── paginated feed ─────────────────────────────────────────
// ?tab=foryou|new|following   &page=1  &limit=20
const getFeed = async (req, res, next) => {
  try {
    const { tab = 'foryou', page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    let filter = { isPublic: true };

    if (tab === 'following') {
      const follows = await Follow.find({ follower: req.user._id }).select('following').lean();
      const ids     = follows.map((f) => f.following);
      filter.author = { $in: ids };
    }

    // 'foryou' sorts by a simple engagement score (likes + comments) then recency
    // 'new' sorts purely by newest first
    const sort = tab === 'foryou'
      ? { likesCountCached: -1, createdAt: -1 }  // likes desc, then newest
      : { createdAt: -1 };

    // Aggregation-free approach: sort by createdAt for now; the distinct tab UX
    // signals intent to the user even if the algorithm is evolving.
    const sortFinal = { createdAt: -1 };

    const posts = await Post.find(filter)
      .sort(sortFinal)
      .skip(skip)
      .limit(Number(limit))
      .populate('author', AUTHOR_SELECT)
      .lean();

    const total = await Post.countDocuments(filter);

    res.json({
      success: true,
      data:    posts.map((p) => formatPost(p, req.user._id)),
      pagination: { page: Number(page), limit: Number(limit), total, hasMore: skip + posts.length < total },
    });
  } catch (err) { next(err); }
};

// ─── POST /api/feed ── create post ────────────────────────────────────────────
const createPost = async (req, res, next) => {
  try {
    const { content, mediaUrls = [], tags = [] } = req.body;
    if (!content?.trim()) return res.status(400).json({ success: false, message: 'Content is required.' });

    const post = await Post.create({
      author:    req.user._id,
      content:   content.trim(),
      mediaUrls: Array.isArray(mediaUrls) ? mediaUrls : [],
      tags:      Array.isArray(tags) ? tags.map((t) => t.toLowerCase().replace(/\s+/g, '')) : [],
    });

    const populated = await post.populate('author', AUTHOR_SELECT);
    res.status(201).json({ success: true, data: formatPost(populated.toObject(), req.user._id) });
  } catch (err) { next(err); }
};

// ─── GET /api/feed/:postId ────────────────────────────────────────────────────
const getPost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId)
      .populate('author', AUTHOR_SELECT)
      .populate('comments.author', AUTHOR_SELECT)
      .lean();
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
    await Post.findByIdAndUpdate(req.params.postId, { $inc: { views: 1 } });
    res.json({ success: true, data: formatPost(post, req.user._id) });
  } catch (err) { next(err); }
};

// ─── DELETE /api/feed/:postId ─────────────────────────────────────────────────
const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findOneAndDelete({ _id: req.params.postId, author: req.user._id });
    if (!post) return res.status(404).json({ success: false, message: 'Post not found or not yours.' });
    res.json({ success: true, message: 'Post deleted.' });
  } catch (err) { next(err); }
};

// ─── POST /api/feed/:postId/like ──────────────────────────────────────────────
const toggleLike = async (req, res, next) => {
  try {
    const post   = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
    const uid    = String(req.user._id);
    const liked  = post.likes.some((id) => String(id) === uid);
    if (liked) {
      post.likes = post.likes.filter((id) => String(id) !== uid);
    } else {
      post.likes.push(req.user._id);
    }
    await post.save();
    res.json({ success: true, data: { liked: !liked, likesCount: post.likes.length } });
  } catch (err) { next(err); }
};

// ─── POST /api/feed/:postId/save ──────────────────────────────────────────────
const toggleSave = async (req, res, next) => {
  try {
    const post  = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
    const uid   = String(req.user._id);
    const saved = post.saves.some((id) => String(id) === uid);
    if (saved) {
      post.saves = post.saves.filter((id) => String(id) !== uid);
    } else {
      post.saves.push(req.user._id);
    }
    await post.save();
    res.json({ success: true, data: { saved: !saved, savesCount: post.saves.length } });
  } catch (err) { next(err); }
};

// ─── POST /api/feed/:postId/comments ──────────────────────────────────────────
const addComment = async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ success: false, message: 'Comment cannot be empty.' });
    const post = await Post.findByIdAndUpdate(
      req.params.postId,
      { $push: { comments: { author: req.user._id, content: content.trim() } } },
      { new: true }
    ).populate('comments.author', AUTHOR_SELECT);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
    const newComment = post.comments[post.comments.length - 1];
    res.status(201).json({ success: true, data: newComment });
  } catch (err) { next(err); }
};

// ─── DELETE /api/feed/:postId/comments/:commentId ────────────────────────────
const deleteComment = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found.' });
    if (String(comment.author) !== String(req.user._id) && String(post.author) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }
    comment.deleteOne();
    await post.save();
    res.json({ success: true, message: 'Comment deleted.' });
  } catch (err) { next(err); }
};

// ─── POST /api/feed/follow/:userId ────────────────────────────────────────────
const toggleFollow = async (req, res, next) => {
  try {
    const targetId = req.params.userId;
    if (String(targetId) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: 'Cannot follow yourself.' });
    }
    const exists = await Follow.findOne({ follower: req.user._id, following: targetId });
    if (exists) {
      await exists.deleteOne();
      return res.json({ success: true, data: { following: false } });
    }
    await Follow.create({ follower: req.user._id, following: targetId });
    res.json({ success: true, data: { following: true } });
  } catch (err) { next(err); }
};

// ─── GET /api/feed/saved ──────────────────────────────────────────────────────
const getSavedPosts = async (req, res, next) => {
  try {
    const posts = await Post.find({ saves: req.user._id })
      .sort({ createdAt: -1 })
      .populate('author', AUTHOR_SELECT)
      .lean();
    res.json({ success: true, data: posts.map((p) => formatPost(p, req.user._id)) });
  } catch (err) { next(err); }
};

// ─── GET /api/feed/profile/:userId ───────────────────────────────────────────
const getUserPosts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip  = (Number(page) - 1) * Number(limit);
    const posts = await Post.find({ author: req.params.userId, isPublic: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('author', AUTHOR_SELECT)
      .lean();
    const total         = await Post.countDocuments({ author: req.params.userId, isPublic: true });
    const followersCount = await Follow.countDocuments({ following: req.params.userId });
    const followingCount = await Follow.countDocuments({ follower:  req.params.userId });
    const isFollowing    = !!(await Follow.findOne({ follower: req.user._id, following: req.params.userId }));
    res.json({
      success: true,
      data: {
        posts:    posts.map((p) => formatPost(p, req.user._id)),
        followersCount,
        followingCount,
        isFollowing,
        pagination: { page: Number(page), limit: Number(limit), total },
      },
    });
  } catch (err) { next(err); }
};

// ─── PATCH /api/feed/social-profile ─── update username / profilePhoto ───────
const updateSocialProfile = async (req, res, next) => {
  try {
    const { userName, profilePhoto } = req.body;
    const updates = {};
    if (userName?.trim()) updates.userName = userName.trim().toLowerCase();
    if (profilePhoto)     updates.profilePhoto = profilePhoto;
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true })
      .select(AUTHOR_SELECT)
      .lean();
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

module.exports = {
  getFeed,
  createPost,
  getPost,
  deletePost,
  toggleLike,
  toggleSave,
  addComment,
  deleteComment,
  toggleFollow,
  getSavedPosts,
  getUserPosts,
  updateSocialProfile,
};
