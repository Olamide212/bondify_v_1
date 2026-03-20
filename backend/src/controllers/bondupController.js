const Bondup = require('../models/Bondup');
const BondupChat = require('../models/BondupChat');
const Follow = require('../models/Follow');
const { mapUserImages } = require('../utils/imageHelper');

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Enrich a lean Bondup document so createdBy + participant image URLs
 * are accessible (signed S3 or public base URL).
 */
const enrichBondupImages = async (bondup) => {
  if (!bondup) return bondup;
  const b = { ...bondup };
  if (b.createdBy && typeof b.createdBy === 'object') {
    b.createdBy = await mapUserImages(b.createdBy);
  }
  if (Array.isArray(b.participants)) {
    b.participants = await Promise.all(
      b.participants.map(async (pt) => {
        if (pt.user && typeof pt.user === 'object') {
          return { ...pt, user: await mapUserImages(pt.user) };
        }
        return pt;
      })
    );
  }
  return b;
};

const safeEmit = (event, data) => {
  try {
    const { getIO } = require('../socket');
    getIO().emit(event, data);
  } catch (_) {}
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/bondup/create
// ─────────────────────────────────────────────────────────────────────────────
const createBondup = async (req, res, next) => {
  try {
    const {
      title,
      description,
      activityType,
      location,
      city,
      dateTime,
      visibility = 'public',
      maxParticipants,
      postType = 'join_me',
    } = req.body;

    // ── Validation ────────────────────────────────────────────────────────────
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required.' });
    }

    if (!activityType || !['coffee', 'food', 'drinks', 'gym', 'walk', 'movie', 'other'].includes(activityType)) {
      return res.status(400).json({ success: false, message: 'Invalid activity type.' });
    }

    if (!dateTime) {
      return res.status(400).json({ success: false, message: 'Date and time is required.' });
    }

    const meetupTime = new Date(dateTime);
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    if (meetupTime < now) {
      return res.status(400).json({ success: false, message: 'dateTime must be in the future.' });
    }
    if (meetupTime > sevenDaysLater) {
      return res.status(400).json({ success: false, message: 'dateTime must be within the next 7 days.' });
    }

    if (!['public', 'circle'].includes(visibility)) {
      return res.status(400).json({ success: false, message: 'visibility must be public or circle.' });
    }

    if (!['join_me', 'i_am_available'].includes(postType)) {
      return res.status(400).json({ success: false, message: 'postType must be join_me or i_am_available.' });
    }

    // Use user's city if not provided
    const bondupCity = (city || '').trim() ||
      req.user?.socialProfile?.city ||
      req.user?.location?.city ||
      '';

    // Expire 24 hours after the event
    const expiresAt = new Date(meetupTime.getTime() + 24 * 60 * 60 * 1000);

    const bondup = await Bondup.create({
      title: title.trim(),
      description: (description || '').trim(),
      activityType,
      location: (location || '').trim(),
      city: bondupCity,
      dateTime: meetupTime,
      visibility,
      postType,
      maxParticipants: maxParticipants ? Number(maxParticipants) : null,
      participants: [],
      createdBy: req.user._id,
      expiresAt,
    });

    const populated = await Bondup.findById(bondup._id)
      .populate('createdBy', 'firstName lastName images profilePhoto userName')
      .lean();

    const data = await enrichBondupImages({
      ...populated,
      hasJoined: false,
      isOwner: true,
    });

    safeEmit('bondup:new', data);

    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/bondup/public — all public Bondups in user's city
// ─────────────────────────────────────────────────────────────────────────────
const getPublicBondups = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, activityType, date, sort = 'soonest', postType } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const now = new Date();

    const filter = {
      visibility: 'public',
      isActive: true,
      expiresAt: { $gt: now },
    };

    // Optional city filter — only when client explicitly passes ?city=...
    const cityParam = (req.query.city || '').trim();
    if (cityParam) {
      filter.city = { $regex: new RegExp(cityParam.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') };
    }

    if (activityType && ['coffee', 'food', 'drinks', 'gym', 'walk', 'movie', 'other'].includes(activityType)) {
      filter.activityType = activityType;
    }

    if (postType && ['join_me', 'i_am_available'].includes(postType)) {
      filter.postType = postType;
    }

    if (date) {
      const d = new Date(date);
      const start = new Date(d); start.setHours(0, 0, 0, 0);
      const end = new Date(d); end.setHours(23, 59, 59, 999);
      filter.dateTime = { $gte: start, $lte: end };
    }

    const sortOrder = sort === 'newest' ? { createdAt: -1 } : { dateTime: 1 };

    const [bondups, total] = await Promise.all([
      Bondup.find(filter)
        .sort(sortOrder)
        .skip(skip)
        .limit(Number(limit))
        .populate('createdBy', 'firstName lastName images profilePhoto userName')
        .populate('participants.user', 'firstName lastName images profilePhoto userName')
        .lean(),
      Bondup.countDocuments(filter),
    ]);

    const userId = String(req.user._id);
    const data = await Promise.all(
      bondups.map(async (b) => {
        const enriched = await enrichBondupImages(b);
        return {
          ...enriched,
          hasJoined: b.participants.some((pt) => String(pt.user?._id || pt.user) === userId),
          isOwner: String(b.createdBy?._id || b.createdBy) === userId,
        };
      })
    );

    res.json({
      success: true,
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        hasMore: skip + bondups.length < total,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/bondup/circle — Bondups from user's circle (followers/following)
// ─────────────────────────────────────────────────────────────────────────────
const getCircleBondups = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, activityType, date, sort = 'soonest', postType } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const now = new Date();
    const userId = req.user._id;

    // Get the user's circle (people they follow + people who follow them)
    const [following, followers] = await Promise.all([
      Follow.find({ follower: userId }).select('following').lean(),
      Follow.find({ following: userId }).select('follower').lean(),
    ]);

    const circleIds = new Set([
      ...following.map((f) => String(f.following)),
      ...followers.map((f) => String(f.follower)),
    ]);

    if (circleIds.size === 0) {
      return res.json({
        success: true,
        data: [],
        pagination: { page: Number(page), limit: Number(limit), total: 0, hasMore: false },
      });
    }

    const filter = {
      visibility: 'circle',
      isActive: true,
      expiresAt: { $gt: now },
      createdBy: { $in: [...circleIds] },
    };

    if (activityType && ['coffee', 'food', 'drinks', 'gym', 'walk', 'movie', 'other'].includes(activityType)) {
      filter.activityType = activityType;
    }

    if (postType && ['join_me', 'i_am_available'].includes(postType)) {
      filter.postType = postType;
    }

    if (date) {
      const d = new Date(date);
      const start = new Date(d); start.setHours(0, 0, 0, 0);
      const end = new Date(d); end.setHours(23, 59, 59, 999);
      filter.dateTime = { $gte: start, $lte: end };
    }

    const sortOrder = sort === 'newest' ? { createdAt: -1 } : { dateTime: 1 };

    const [bondups, total] = await Promise.all([
      Bondup.find(filter)
        .sort(sortOrder)
        .skip(skip)
        .limit(Number(limit))
        .populate('createdBy', 'firstName lastName images profilePhoto userName')
        .populate('participants.user', 'firstName lastName images profilePhoto userName')
        .lean(),
      Bondup.countDocuments(filter),
    ]);

    const userIdStr = String(userId);
    const data = await Promise.all(
      bondups.map(async (b) => {
        const enriched = await enrichBondupImages(b);
        return {
          ...enriched,
          hasJoined: b.participants.some((pt) => String(pt.user?._id || pt.user) === userIdStr),
          isOwner: String(b.createdBy?._id || b.createdBy) === userIdStr,
        };
      })
    );

    res.json({
      success: true,
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        hasMore: skip + bondups.length < total,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/bondup/join/:id
// ─────────────────────────────────────────────────────────────────────────────
const joinBondup = async (req, res, next) => {
  try {
    const bondup = await Bondup.findById(req.params.id);

    if (!bondup || !bondup.isActive) {
      return res.status(404).json({ success: false, message: 'Bondup not found.' });
    }

    if (bondup.expiresAt < new Date() || bondup.dateTime < new Date()) {
      return res.status(400).json({ success: false, message: 'This Bondup has expired.' });
    }

    const userId = String(req.user._id);

    if (String(bondup.createdBy) === userId) {
      return res.status(400).json({ success: false, message: "You can't join your own Bondup." });
    }

    if (bondup.participants.some((p) => String(p.user) === userId)) {
      return res.status(400).json({ success: false, message: 'You have already joined this Bondup.' });
    }

    if (bondup.maxParticipants && bondup.participants.length >= bondup.maxParticipants) {
      return res.status(400).json({ success: false, message: 'This Bondup is full.' });
    }

    bondup.participants.push({ user: req.user._id });

    // Create or update the BondupChat
    let chat = await BondupChat.findOne({ bondup: bondup._id });
    if (!chat) {
      const memberIds = [bondup.createdBy, req.user._id];
      chat = await BondupChat.create({
        bondup: bondup._id,
        type: 'bondup_single',
        members: memberIds,
        expiresAt: new Date(bondup.dateTime.getTime() + 24 * 60 * 60 * 1000),
      });
      bondup.chatId = chat._id;
    } else {
      // Add new member if not already in chat
      if (!chat.members.some((m) => String(m) === userId)) {
        chat.members.push(req.user._id);
        // Upgrade to group if 3+ members
        if (chat.members.length >= 3) {
          chat.type = 'bondup_group';
        }
        await chat.save();
      }
    }

    await bondup.save();

    const populated = await Bondup.findById(bondup._id)
      .populate('createdBy', 'firstName lastName images profilePhoto userName')
      .populate('participants.user', 'firstName lastName images profilePhoto userName')
      .lean();

    const data = await enrichBondupImages({
      ...populated,
      hasJoined: true,
      isOwner: String(populated.createdBy?._id || populated.createdBy) === userId,
    });

    // Real-time: notify bondup creator + broadcast updated bondup
    try {
      const { getIO } = require('../socket');
      const io = getIO();
      io.to(`user:${String(bondup.createdBy)}`).emit('bondup:joined', {
        bondupId: bondup._id,
        joinedUser: {
          _id: req.user._id,
          firstName: req.user.firstName,
          lastName: req.user.lastName,
        },
      });
      io.emit('bondup:updated', data);
    } catch (_) {}

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/bondup/leave/:id
// ─────────────────────────────────────────────────────────────────────────────
const leaveBondup = async (req, res, next) => {
  try {
    const bondup = await Bondup.findById(req.params.id);
    if (!bondup) return res.status(404).json({ success: false, message: 'Bondup not found.' });

    const userId = String(req.user._id);
    bondup.participants = bondup.participants.filter((p) => String(p.user) !== userId);

    // Remove from chat if exists
    if (bondup.chatId) {
      try {
        const chat = await BondupChat.findById(bondup.chatId);
        if (chat) {
          chat.members = chat.members.filter((m) => String(m) !== userId);
          await chat.save();
        }
      } catch (_) {}
    }

    await bondup.save();

    const populated = await Bondup.findById(bondup._id)
      .populate('createdBy', 'firstName lastName images profilePhoto userName')
      .populate('participants.user', 'firstName lastName images profilePhoto userName')
      .lean();

    const data = await enrichBondupImages({
      ...populated,
      hasJoined: false,
      isOwner: String(populated.createdBy?._id || populated.createdBy) === userId,
    });

    safeEmit('bondup:updated', data);

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/bondup/:id — soft-delete (creator only)
// ─────────────────────────────────────────────────────────────────────────────
const deleteBondup = async (req, res, next) => {
  try {
    const bondup = await Bondup.findById(req.params.id);
    if (!bondup) return res.status(404).json({ success: false, message: 'Bondup not found.' });

    if (String(bondup.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    bondup.isActive = false;
    await bondup.save();

    safeEmit('bondup:removed', { bondupId: bondup._id });

    res.json({ success: true, message: 'Bondup removed.' });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/bondup/:id — get single Bondup
// ─────────────────────────────────────────────────────────────────────────────
const getBondup = async (req, res, next) => {
  try {
    const bondup = await Bondup.findById(req.params.id)
      .populate('createdBy', 'firstName lastName images profilePhoto userName')
      .populate('participants.user', 'firstName lastName images profilePhoto userName')
      .lean();

    if (!bondup || !bondup.isActive) {
      return res.status(404).json({ success: false, message: 'Bondup not found.' });
    }

    const userId = String(req.user._id);
    const data = await enrichBondupImages({
      ...bondup,
      hasJoined: bondup.participants.some((pt) => String(pt.user?._id || pt.user) === userId),
      isOwner: String(bondup.createdBy?._id || bondup.createdBy) === userId,
    });

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/bondup/my — get current user's Bondups (created or joined)
// ─────────────────────────────────────────────────────────────────────────────
const getMyBondups = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    const bondups = await Bondup.find({
      $or: [
        { createdBy: userId },
        { 'participants.user': userId },
      ],
      isActive: true,
      expiresAt: { $gt: now },
    })
      .sort({ dateTime: 1 })
      .populate('createdBy', 'firstName lastName images profilePhoto userName')
      .populate('participants.user', 'firstName lastName images profilePhoto userName')
      .lean();

    const userIdStr = String(userId);
    const data = await Promise.all(
      bondups.map(async (b) => {
        const enriched = await enrichBondupImages(b);
        return {
          ...enriched,
          hasJoined: b.participants.some((pt) => String(pt.user?._id || pt.user) === userIdStr),
          isOwner: String(b.createdBy?._id || b.createdBy) === userIdStr,
        };
      })
    );

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/bondup/profile/:userId — Public bondup user profile (no chat required)
// ─────────────────────────────────────────────────────────────────────────────
const getBondupProfile = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const User = require('mongoose').model('User');

    const targetUser = await User.findById(userId)
      .select('firstName lastName images profilePhoto userName city')
      .lean();

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const enrichedUser = await mapUserImages(targetUser);

    // Get user's active bondups
    const now = new Date();
    const activeBondups = await Bondup.find({
      $or: [
        { createdBy: userId },
        { 'participants.user': userId },
      ],
      isActive: true,
      expiresAt: { $gt: now },
    })
      .sort({ dateTime: 1 })
      .limit(10)
      .populate('createdBy', 'firstName lastName images profilePhoto')
      .lean();

    // Get follow stats
    let followStats = { followersCount: 0, followingCount: 0, bio: '' };
    try {
      const SocialProfile = require('mongoose').model('SocialProfile');
      const socialProfile = await SocialProfile.findOne({ user: userId }).lean();
      if (socialProfile) {
        followStats = {
          followersCount: socialProfile.followersCount || socialProfile.followers?.length || 0,
          followingCount: socialProfile.followingCount || socialProfile.following?.length || 0,
          bio: socialProfile.bio || '',
        };
      }
    } catch {
      // SocialProfile model may not exist — use Follow model fallback
      try {
        const followersCount = await Follow.countDocuments({ following: userId });
        const followingCount = await Follow.countDocuments({ follower: userId });
        followStats = { followersCount, followingCount, bio: '' };
      } catch {
        // silent
      }
    }

    // Check if requester follows this user
    let isFollowing = false;
    try {
      const existing = await Follow.findOne({ follower: req.user._id, following: userId });
      isFollowing = !!existing;
    } catch {
      // silent
    }

    res.json({
      success: true,
      data: {
        user: enrichedUser,
        stats: {
          ...followStats,
          bondups: activeBondups.length,
        },
        isFollowing,
        activeBondups: activeBondups.map((b) => ({
          _id: b._id,
          title: b.title,
          activityType: b.activityType,
          city: b.city,
          dateTime: b.dateTime,
          participantCount: b.participants?.length || 0,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createBondup,
  getPublicBondups,
  getCircleBondups,
  joinBondup,
  leaveBondup,
  deleteBondup,
  getBondup,
  getMyBondups,
  getBondupProfile,
};
