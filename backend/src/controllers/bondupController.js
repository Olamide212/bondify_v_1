const Bondup = require('../models/Bondup');
const BondupChat = require('../models/BondupChat');
const Follow = require('../models/Follow');
const FriendRequest = require('../models/FriendRequest');
const { mapUserImages, getImageUrl, uploadToS3 } = require('../utils/imageHelper');

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

    if (!activityType || !['coffee', 'food', 'drinks', 'brunch', 'dinner', 'lunch', 'snacks', 'dessert', 'gym', 'yoga', 'running', 'hiking', 'cycling', 'swimming', 'tennis', 'basketball', 'football', 'volleyball', 'walk', 'park', 'beach', 'picnic', 'camping', 'fishing', 'movie', 'theater', 'concert', 'museum', 'art', 'comedy', 'board_games', 'video_games', 'karaoke', 'dancing', 'party', 'networking', 'workshop', 'class', 'photography', 'painting', 'music', 'other'].includes(activityType)) {
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

    // Required city filter for public bondups - they should only be visible in the creator's city
    const cityParam = (req.query.city || '').trim();
    if (!cityParam) {
      return res.json({
        success: true,
        data: [],
        pagination: { page: Number(page), limit: Number(limit), total: 0, hasMore: false },
      });
    }
    filter.city = { $regex: new RegExp(cityParam.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') };

    if (activityType && ['coffee', 'food', 'drinks', 'brunch', 'dinner', 'lunch', 'snacks', 'dessert', 'gym', 'yoga', 'running', 'hiking', 'cycling', 'swimming', 'tennis', 'basketball', 'football', 'volleyball', 'walk', 'park', 'beach', 'picnic', 'camping', 'fishing', 'movie', 'theater', 'concert', 'museum', 'art', 'comedy', 'board_games', 'video_games', 'karaoke', 'dancing', 'party', 'networking', 'workshop', 'class', 'photography', 'painting', 'music', 'other'].includes(activityType)) {
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

    // Get the user's circle (people they follow)
    const following = await Follow.find({ follower: userId }).select('following').lean();

    const followingIds = following.map((f) => String(f.following));

    if (followingIds.length === 0) {
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
      createdBy: { $in: followingIds },
    };

    if (activityType && ['coffee', 'food', 'drinks', 'brunch', 'dinner', 'lunch', 'snacks', 'dessert', 'gym', 'yoga', 'running', 'hiking', 'cycling', 'swimming', 'tennis', 'basketball', 'football', 'volleyball', 'walk', 'park', 'beach', 'picnic', 'camping', 'fishing', 'movie', 'theater', 'concert', 'museum', 'art', 'comedy', 'board_games', 'video_games', 'karaoke', 'dancing', 'party', 'networking', 'workshop', 'class', 'photography', 'painting', 'music', 'other'].includes(activityType)) {
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
// POST /api/bondup/friend-request/:userId
// ─────────────────────────────────────────────────────────────────────────────
const sendFriendRequest = async (req, res, next) => {
  try {
    const receiverId = req.params.userId;
    if (String(receiverId) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: 'Cannot send friend request to yourself.' });
    }

    // Check if users are already friends
    const existingFriendship = await FriendRequest.findOne({
      $or: [
        { sender: req.user._id, receiver: receiverId, status: 'accepted' },
        { sender: receiverId, receiver: req.user._id, status: 'accepted' }
      ]
    });

    if (existingFriendship) {
      return res.status(400).json({ success: false, message: 'Users are already friends.' });
    }

    // Check if there's already a pending request
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: req.user._id, receiver: receiverId, status: 'pending' },
        { sender: receiverId, receiver: req.user._id, status: 'pending' }
      ]
    });

    if (existingRequest) {
      return res.status(400).json({ success: false, message: 'Friend request already exists.' });
    }

    const friendRequest = await FriendRequest.create({
      sender: req.user._id,
      receiver: receiverId,
      status: 'pending'
    });

    res.json({ success: true, data: { friendRequest, status: 'pending' } });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/bondup/friend-request/:requestId/accept
// ─────────────────────────────────────────────────────────────────────────────
const acceptFriendRequest = async (req, res, next) => {
  try {
    const request = await FriendRequest.findById(req.params.requestId);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Friend request not found.' });
    }

    if (String(request.receiver) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to accept this request.' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Request is not pending.' });
    }

    request.status = 'accepted';
    await request.save();

    res.json({ success: true, data: { friendRequest: request, status: 'accepted' } });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/bondup/friend-request/:requestId/decline
// ─────────────────────────────────────────────────────────────────────────────
const declineFriendRequest = async (req, res, next) => {
  try {
    const request = await FriendRequest.findById(req.params.requestId);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Friend request not found.' });
    }

    if (String(request.receiver) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to decline this request.' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Request is not pending.' });
    }

    request.status = 'declined';
    await request.save();

    res.json({ success: true, data: { friendRequest: request, status: 'declined' } });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/bondup/friend-requests — get pending friend requests for current user
// ─────────────────────────────────────────────────────────────────────────────
const getFriendRequests = async (req, res, next) => {
  try {
    const requests = await FriendRequest.find({
      receiver: req.user._id,
      status: 'pending'
    })
    .populate('sender', 'firstName lastName userName images profilePhoto')
    .sort({ createdAt: -1 })
    .lean();

    // Attach social profile data
    const senderIds = requests.map(r => r.sender._id);
    const SocialProfile = require('../models/SocialProfile');
    const socialProfiles = await SocialProfile.find({ user: { $in: senderIds } }).lean();
    const spMap = {};
    socialProfiles.forEach(sp => { spMap[String(sp.user)] = sp; });

    const enrichedRequests = requests.map(request => ({
      ...request,
      sender: {
        ...request.sender,
        profilePhoto: spMap[String(request.sender._id)]?.profilePhoto || request.sender.profilePhoto,
        displayName: spMap[String(request.sender._id)]?.displayName || null,
      }
    }));

    res.json({ success: true, data: enrichedRequests });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/bondup/friends/:userId
// ─────────────────────────────────────────────────────────────────────────────
const getFriends = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.user._id;

    const friendships = await FriendRequest.find({
      $or: [
        { sender: userId, status: 'accepted' },
        { receiver: userId, status: 'accepted' }
      ]
    })
    .populate('sender', 'firstName lastName userName')
    .populate('receiver', 'firstName lastName userName')
    .lean();

    // Attach social profile data
    const friendIds = [];
    friendships.forEach(f => {
      if (String(f.sender._id) !== String(userId)) friendIds.push(f.sender._id);
      if (String(f.receiver._id) !== String(userId)) friendIds.push(f.receiver._id);
    });

    const SocialProfile = require('../models/SocialProfile');
    const socialProfiles = await SocialProfile.find({ user: { $in: friendIds } }).lean();
    const spMap = {};
    socialProfiles.forEach(sp => { spMap[String(sp.user)] = sp; });

    const friends = await Promise.all(friendships.map(async (f) => {
      const friend = String(f.sender._id) === String(userId) ? f.receiver : f.sender;
      const profilePhoto = spMap[String(friend._id)]?.profilePhoto;
      const processedProfilePhoto = profilePhoto ? await getImageUrl(profilePhoto) : null;
      
      return {
        ...friend,
        profilePhoto: processedProfilePhoto,
        displayName: spMap[String(friend._id)]?.displayName || null,
      };
    }));

    res.json({ success: true, data: friends });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/bondup/mutual-friends/:userId
// ─────────────────────────────────────────────────────────────────────────────
const getMutualFriends = async (req, res, next) => {
  try {
    const targetUserId = req.params.userId;

    // Get current user's friends
    const currentUserFriends = await FriendRequest.find({
      $or: [
        { sender: req.user._id, status: 'accepted' },
        { receiver: req.user._id, status: 'accepted' }
      ]
    }).select('sender receiver');

    // Get target user's friends
    const targetUserFriends = await FriendRequest.find({
      $or: [
        { sender: targetUserId, status: 'accepted' },
        { receiver: targetUserId, status: 'accepted' }
      ]
    }).select('sender receiver');

    // Extract friend IDs for current user
    const currentUserFriendIds = new Set();
    currentUserFriends.forEach(f => {
      if (String(f.sender) !== String(req.user._id)) currentUserFriendIds.add(String(f.sender));
      if (String(f.receiver) !== String(req.user._id)) currentUserFriendIds.add(String(f.receiver));
    });

    // Extract friend IDs for target user
    const targetUserFriendIds = new Set();
    targetUserFriends.forEach(f => {
      if (String(f.sender) !== String(targetUserId)) targetUserFriendIds.add(String(f.sender));
      if (String(f.receiver) !== String(targetUserId)) targetUserFriendIds.add(String(f.receiver));
    });

    // Find intersection (mutual friends)
    const mutualFriendIds = [...currentUserFriendIds].filter(id => targetUserFriendIds.has(id));

    if (mutualFriendIds.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // Get mutual friends' data
    const User = require('mongoose').model('User');
    const mutualFriends = await User.find({ _id: { $in: mutualFriendIds } })
      .select('firstName lastName userName')
      .lean();

    // Attach social profile data
    const SocialProfile = require('../models/SocialProfile');
    const socialProfiles = await SocialProfile.find({ user: { $in: mutualFriendIds } }).lean();
    const spMap = {};
    socialProfiles.forEach(sp => { spMap[String(sp.user)] = sp; });

    const mutualFriendsWithProfiles = await Promise.all(mutualFriends.map(async (friend) => {
      const profilePhoto = spMap[String(friend._id)]?.profilePhoto;
      const processedProfilePhoto = profilePhoto ? await getImageUrl(profilePhoto) : null;
      
      return {
        ...friend,
        profilePhoto: processedProfilePhoto,
        displayName: spMap[String(friend._id)]?.displayName || null,
      };
    }));

    res.json({ success: true, data: mutualFriendsWithProfiles });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/bondup/friend-status/:userId
// ─────────────────────────────────────────────────────────────────────────────
const getFriendStatus = async (req, res, next) => {
  try {
    const targetUserId = req.params.userId;

    // Check if users are friends
    const friendship = await FriendRequest.findOne({
      $or: [
        { sender: req.user._id, receiver: targetUserId, status: 'accepted' },
        { sender: targetUserId, receiver: req.user._id, status: 'accepted' }
      ]
    });

    if (friendship) {
      return res.json({ success: true, data: { status: 'friends' } });
    }

    // Check for pending requests
    const sentRequest = await FriendRequest.findOne({
      sender: req.user._id,
      receiver: targetUserId,
      status: 'pending'
    });

    if (sentRequest) {
      return res.json({ success: true, data: { status: 'request_sent', requestId: sentRequest._id } });
    }

    const receivedRequest = await FriendRequest.findOne({
      sender: targetUserId,
      receiver: req.user._id,
      status: 'pending'
    });

    if (receivedRequest) {
      return res.json({ success: true, data: { status: 'request_received', requestId: receivedRequest._id } });
    }

    // No relationship
    res.json({ success: true, data: { status: 'none' } });
  } catch (err) { next(err); }
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

    // Check friend status instead of follow status
    let friendStatus = 'none';
    try {
      // Check if users are friends
      const friendship = await FriendRequest.findOne({
        $or: [
          { sender: req.user._id, receiver: userId, status: 'accepted' },
          { sender: userId, receiver: req.user._id, status: 'accepted' }
        ]
      });

      if (friendship) {
        friendStatus = 'friends';
      } else {
        // Check for pending requests
        const sentRequest = await FriendRequest.findOne({
          sender: req.user._id,
          receiver: userId,
          status: 'pending'
        });

        if (sentRequest) {
          friendStatus = 'request_sent';
        } else {
          const receivedRequest = await FriendRequest.findOne({
            sender: userId,
            receiver: req.user._id,
            status: 'pending'
          });

          if (receivedRequest) {
            friendStatus = 'request_received';
          }
        }
      }
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
        friendStatus,
        activeBondups: activeBondups.map((b) => ({
          _id: b._id,
          title: b.title,
          description: b.description,
          activityType: b.activityType,
          city: b.city,
          dateTime: b.dateTime,
          participantCount: b.participants?.length || 0,
          createdBy: b.createdBy,
          hasJoined: b.participants?.some((pt) => String(pt.user) === String(req.user._id)) || false,
          isOwner: String(b.createdBy?._id || b.createdBy) === String(req.user._id),
        })),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/bondup/social-profile — current user's social profile —————————————
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

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/bondup/social-profile — update social profile fields ————————————
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

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/bondup/social-profile/photo — upload social avatar to S3 —————————
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
  sendFriendRequest,
  getFriendRequests,
  acceptFriendRequest,
  declineFriendRequest,
  getFriends,
  getFriendStatus,
  getMutualFriends,
  getSocialProfile,
  updateSocialProfile,
  uploadSocialPhoto,
};
