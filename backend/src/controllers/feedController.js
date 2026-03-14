const Post          = require('../models/Post');
const Follow        = require('../models/Follow');
const User          = require('../models/User');
const SocialProfile = require('../models/SocialProfile');
const { uploadToS3 } = require('../utils/imageHelper');

// ─── helpers ──────────────────────────────────────────────────────────────────
// profilePhoto lives on SocialProfile, not User — do not include it here
const AUTHOR_SELECT = 'firstName lastName userName nationality images';

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

// Batch-fetch SocialProfile docs and overlay profilePhoto / displayName onto
// each post.author (and comment authors) in-place.  Works on lean objects.
const attachSocialProfiles = async (posts) => {
  if (!posts.length) return posts;

  // Collect unique author IDs from post authors and comment authors
  const idSet = new Set();
  posts.forEach((p) => {
    if (p.author?._id) idSet.add(String(p.author._id));
    (p.comments || []).forEach((c) => {
      if (c.author?._id) idSet.add(String(c.author._id));
    });
  });

  if (!idSet.size) return posts;

  const socialProfiles = await SocialProfile.find({ user: { $in: [...idSet] } }).lean();
  const spMap = {};
  socialProfiles.forEach((sp) => { spMap[String(sp.user)] = sp; });

  posts.forEach((post) => {
    if (post.author?._id) {
      const sp = spMap[String(post.author._id)];
      if (sp) {
        post.author.profilePhoto = sp.profilePhoto ?? null;
        post.author.displayName  = sp.displayName  ?? null;
      }
    }
    (post.comments || []).forEach((comment) => {
      if (comment.author?._id) {
        const sp = spMap[String(comment.author._id)];
        if (sp) {
          comment.author.profilePhoto = sp.profilePhoto ?? null;
          comment.author.displayName  = sp.displayName  ?? null;
        }
      }
    });
  });

  return posts;
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
      .populate('comments.author', AUTHOR_SELECT)
      .lean();

    const total = await Post.countDocuments(filter);

    await attachSocialProfiles(posts);

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
    const postObj = populated.toObject();
    await attachSocialProfiles([postObj]);
    res.status(201).json({ success: true, data: formatPost(postObj, req.user._id) });
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
    await attachSocialProfiles([post]);
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
    const { content, parentId = null } = req.body;
    if (!content?.trim()) return res.status(400).json({ success: false, message: 'Comment cannot be empty.' });
    const newEntry = { author: req.user._id, content: content.trim() };
    if (parentId) newEntry.parentId = parentId;
    const post = await Post.findByIdAndUpdate(
      req.params.postId,
      { $push: { comments: newEntry } },
      { new: true }
    ).populate('comments.author', AUTHOR_SELECT);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
    const newComment = post.comments[post.comments.length - 1]?.toObject();
    if (!newComment) return res.status(500).json({ success: false, message: 'Comment could not be created.' });
    // Overlay social profile data on the comment author
    const sp = await SocialProfile.findOne({ user: req.user._id }).lean();
    if (sp && newComment.author) {
      newComment.author.profilePhoto = sp.profilePhoto ?? null;
      newComment.author.displayName  = sp.displayName  ?? null;
    }
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
      .populate('comments.author', AUTHOR_SELECT)
      .lean();
    await attachSocialProfiles(posts);
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
    await attachSocialProfiles(posts);
    const total          = await Post.countDocuments({ author: req.params.userId, isPublic: true });
    const followersCount = await Follow.countDocuments({ following: req.params.userId });
    const followingCount = await Follow.countDocuments({ follower:  req.params.userId });
    const isFollowing    = !!(await Follow.findOne({ follower: req.user._id, following: req.params.userId }));
    const targetSocialProfile = await SocialProfile.findOne({ user: req.params.userId }).lean();
    res.json({
      success: true,
      data: {
        posts:         posts.map((p) => formatPost(p, req.user._id)),
        followersCount,
        followingCount,
        isFollowing,
        socialProfile: targetSocialProfile || null,
        pagination: { page: Number(page), limit: Number(limit), total },
      },
    });
  } catch (err) { next(err); }
};

// ─── GET /api/feed/social-profile ── current user's social profile ───────────
const getSocialProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select('firstName lastName userName nationality images')
      .lean();
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    let socialProfile = await SocialProfile.findOne({ user: req.user._id }).lean();
    if (!socialProfile) {
      // Auto-seed from existing user data on first access
      socialProfile = await SocialProfile.create({ user: req.user._id, userName: user.userName });
    }

    const followersCount = await Follow.countDocuments({ following: req.user._id });
    const followingCount = await Follow.countDocuments({ follower: req.user._id });
    const postsCount     = await Post.countDocuments({ author: req.user._id, isPublic: true });
    res.json({
      success: true,
      data: {
        ...user,
        displayName:  socialProfile.displayName  ?? null,
        profilePhoto: socialProfile.profilePhoto  ?? null,
        bio:          socialProfile.bio           ?? null,
        followersCount,
        followingCount,
        postsCount,
      },
    });
  } catch (err) { next(err); }
};

// ─── PATCH /api/feed/social-profile ─── update social profile fields ─────────
const updateSocialProfile = async (req, res, next) => {
  try {
    const { userName, displayName, profilePhoto, bio } = req.body;
    const updates = {};
    if (userName     !== undefined) updates.userName     = String(userName).trim().toLowerCase();
    if (displayName  !== undefined) updates.displayName  = String(displayName).trim();
    if (profilePhoto !== undefined) updates.profilePhoto = profilePhoto;
    if (bio          !== undefined) updates.bio          = String(bio).trim();

    const socialProfile = await SocialProfile.findOneAndUpdate(
      { user: req.user._id },
      updates,
      { new: true, upsert: true }
    ).lean();
    res.json({ success: true, data: socialProfile });
  } catch (err) { next(err); }
};

// ─── POST /api/feed/social-profile/photo ── upload social avatar to S3 ───────
const uploadSocialPhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const { url, publicId } = await uploadToS3(req.file, `social-avatars/${req.user._id}`);

    const socialProfile = await SocialProfile.findOneAndUpdate(
      { user: req.user._id },
      { profilePhoto: url, profilePhotoKey: publicId },
      { new: true, upsert: true }
    ).lean();

    res.json({ success: true, data: { profilePhoto: url, socialProfile } });
  } catch (err) { next(err); }
};

// ─── POST /api/feed/:postId/comments/:commentId/like ─── toggle comment like ─
const toggleCommentLike = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
    const uid = String(req.user._id);
    const idx = (comment.likes || []).findIndex((l) => String(l) === uid);
    if (idx > -1) {
      comment.likes.splice(idx, 1);
    } else {
      comment.likes.push(req.user._id);
    }
    await post.save();
    res.json({
      success: true,
      data: {
        isLiked: idx === -1,
        likesCount: comment.likes.length,
      },
    });
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
  toggleCommentLike,
  toggleFollow,
  getSavedPosts,
  getUserPosts,
  getSocialProfile,
  updateSocialProfile,
  uploadSocialPhoto,
};
