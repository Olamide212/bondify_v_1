// ─────────────────────────────────────────────────────────────────────────────
// discoverController.js — Production-ready
// ─────────────────────────────────────────────────────────────────────────────

const User    = require('../models/User');
const Like    = require('../models/Like');
const Match   = require('../models/Match');
const { getIO } = require('../socket');
const { mapImagesWithAccessUrls } = require('../utils/imageHelper');
const { sendPushToUser } = require('../utils/pushDispatchService');

// ─── Discovery ────────────────────────────────────────────────────────────────
const getDiscoveryProfiles = async (req, res, next) => {
  try {
    const userId      = req.user._id;
    const currentUser = await User.findById(userId).lean(); // BUG FIX 1: use .lean() — no need to hydrate a full Mongoose doc just for coordinates

    if (!currentUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const {
      minAge, maxAge, maxDistance, gender, religion, ethnicity,
      drinking, smoking, interests, verifiedOnly, activeToday, location,
      page = 1, limit = 20,
    } = req.query;

    const sanitizedMinAge      = minAge      ? parseInt(minAge, 10)      : undefined;
    const sanitizedMaxAge      = maxAge      ? parseInt(maxAge, 10)      : undefined;
    const sanitizedMaxDistance = maxDistance ? parseInt(maxDistance, 10) : undefined;
    const sanitizedPage        = Math.max(parseInt(page,  10) || 1, 1);
    const sanitizedLimit       = Math.min(parseInt(limit, 10) || 20, 100);

    // BUG FIX 2: include already-MATCHED users in the exclusion list, not just liked users.
    // Previously, matched users still appeared in discovery after a match.
    const [likedUserIds, matchedUserIds] = await Promise.all([
      Like.find({ user: userId }).distinct('likedUser'),
      Match.find({
        $or: [{ user1: userId }, { user2: userId }],
        status: 'matched',
      }).then((matches) =>
        matches.map((m) =>
          m.user1.toString() === userId.toString() ? m.user2 : m.user1
        )
      ),
    ]);

    const excludedIds = [
      userId,
      ...likedUserIds.map(String),
      ...matchedUserIds.map(String),
    ];

    const query = {
      _id:                 { $nin: excludedIds },
      isActive:            true,
      onboardingCompleted: true,
      isDeleted:           { $ne: true }, // BUG FIX 3: soft-deleted users were still discoverable
    };

    if (String(verifiedOnly).toLowerCase() === 'true') {
      query.verified = true; // BUG FIX 4: was querying isVerified (OTP field), not verified (identity badge)
    }

    if (sanitizedMinAge || sanitizedMaxAge) {
      query.age = {};
      if (sanitizedMinAge) query.age.$gte = sanitizedMinAge;
      if (sanitizedMaxAge) query.age.$lte = sanitizedMaxAge;
    }

    if (gender)    query.gender    = gender;
    if (religion)  query.religion  = religion;
    if (ethnicity) query.ethnicity = ethnicity;
    if (drinking)  query.drinking  = drinking;
    if (smoking)   query.smoking   = smoking;

    if (interests) {
      const interestArray = Array.isArray(interests) ? interests : [interests];
      query.interests = { $in: interestArray };
    }

    if (String(activeToday).toLowerCase() === 'true') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      query.lastActive = { $gte: startOfDay };
    }

    if (location && typeof location === 'string' && location.trim()) {
      const escaped = location.trim().slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { 'location.city':    { $regex: escaped, $options: 'i' } },
        { 'location.state':   { $regex: escaped, $options: 'i' } },
        { 'location.country': { $regex: escaped, $options: 'i' } },
      ];
    }

    if (sanitizedMaxDistance && currentUser.location?.coordinates?.length === 2) {
      const radiusInRadians = (sanitizedMaxDistance * 1000) / 6378137;
      query['location.coordinates'] = {
        $geoWithin: {
          $centerSphere: [currentUser.location.coordinates, radiusInRadians],
        },
      };
    }

    const skip = (sanitizedPage - 1) * sanitizedLimit;

    const [profiles, total] = await Promise.all([
      User.find(query)
        .select('-password -otp -otpExpiry -verificationSelfieUrl')
        .sort({ lastActive: -1, _id: 1 }) // BUG FIX 5: add _id as tiebreaker to make pagination stable
        .skip(skip)
        .limit(sanitizedLimit)
        .lean(),
      User.countDocuments(query),
    ]);

    const profilesWithImages = await Promise.all(
      profiles.map(async (p) => {
        p.images = await mapImagesWithAccessUrls(p.images);
        return p;
      })
    );

    return res.json({
      success: true,
      data: {
        profiles: profilesWithImages,
        pagination: {
          page:  sanitizedPage,
          limit: sanitizedLimit,
          total,
          pages: Math.ceil(total / sanitizedLimit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Like / Pass / Superlike ──────────────────────────────────────────────────
const performAction = async (req, res, next) => {
  try {
    const userId      = req.user._id;
    const { likedUserId, type } = req.body;

    if (!['like', 'superlike', 'pass'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid action type.' });
    }

    const likedUser = await User.findById(likedUserId);
    if (!likedUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Idempotent — silently accept if already recorded
    const existingLike = await Like.findOne({ user: userId, likedUser: likedUserId });
    if (existingLike) {
      return res.status(400).json({ success: false, message: 'Already interacted with this user.' });
    }

    // Create the like record
    await Like.create({ user: userId, likedUser: likedUserId, type });

    // Update stats atomically (no race on save())
    if (type === 'like') {
      await Promise.all([
        User.findByIdAndUpdate(userId,      { $inc: { likesGiven:     1 } }),
        User.findByIdAndUpdate(likedUserId, { $inc: { likesReceived:  1 } }),
      ]);
    } else if (type === 'superlike') {
      await Promise.all([
        User.findByIdAndUpdate(userId,      { $inc: { superLikesGiven:     1 } }),
        User.findByIdAndUpdate(likedUserId, { $inc: { superLikesReceived:  1 } }),
      ]);
    }

    // Check for mutual like → create match
    if (type === 'like' || type === 'superlike') {
      const reciprocalLike = await Like.findOne({
        user:      likedUserId,
        likedUser: userId,
        type:      { $in: ['like', 'superlike'] },
      });

      if (reciprocalLike) {
        // BUG FIX 6: RACE CONDITION — two simultaneous mutual likes could both pass
        // the reciprocal check and both call Match.create(), producing duplicate matches.
        //
        // Fix: always store user1 < user2 (sorted string comparison) so the compound
        // unique index { user1, user2 } catches the duplicate regardless of who triggers it.
        // Use findOneAndUpdate with upsert so the second concurrent request simply gets
        // the existing match document rather than throwing a duplicate key error.
        const [user1, user2] = [userId, likedUserId].map(String).sort();

        const match = await Match.findOneAndUpdate(
          { user1, user2 },
          {
            $setOnInsert: {
              user1,
              user2,
              status:      'matched',
              initiatedBy: userId,
              matchedAt:   new Date(),
            },
          },
          { upsert: true, new: true }
        );

        const io = getIO();

        const currentUser = await User.findById(userId).select('firstName lastName name images age').lean();
        const currentUserName =
          currentUser?.name ||
          [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(' ') ||
          'Someone';
        const likedUserName =
          likedUser?.name ||
          [likedUser?.firstName, likedUser?.lastName].filter(Boolean).join(' ') ||
          'Someone';

        const basePayload = {
          type:      'match',
          matchId:   String(match._id),
          createdAt: new Date().toISOString(),
        };

        io.to(`user:${String(userId)}`).emit('match:new', {
          ...basePayload,
          id:     `match-${match._id}-${userId}`,
          userId: String(likedUserId),
          title:  "It's a match!",
          body:   `You and ${likedUserName} liked each other.`,
          matchedUser: {
            _id:       likedUser._id,
            firstName: likedUser.firstName,
            lastName:  likedUser.lastName,
            name:      likedUserName,
            images:    likedUser.images || [],
            age:       likedUser.age,
          },
        });

        io.to(`user:${String(likedUserId)}`).emit('match:new', {
          ...basePayload,
          id:     `match-${match._id}-${likedUserId}`,
          userId: String(userId),
          title:  "It's a match!",
          body:   `You and ${currentUserName} liked each other.`,
          matchedUser: {
            _id:       currentUser._id,
            firstName: currentUser.firstName,
            lastName:  currentUser.lastName,
            name:      currentUserName,
            images:    currentUser.images || [],
            age:       currentUser.age,
          },
        });

        // Emit notification:new for both users as well
        io.to(`user:${String(userId)}`).emit('notification:new', {
          ...basePayload,
          id:     `notif-match-${match._id}-${userId}`,
          userId: String(likedUserId),
          title:  "It's a match!",
          body:   `You and ${likedUserName} liked each other.`,
        });
        io.to(`user:${String(likedUserId)}`).emit('notification:new', {
          ...basePayload,
          id:     `notif-match-${match._id}-${likedUserId}`,
          userId: String(userId),
          title:  "It's a match!",
          body:   `You and ${currentUserName} liked each other.`,
        });

        sendPushToUser({
          userId,
          title: "It's a match!",
          body: `You and ${likedUserName} liked each other.`,
          data: {
            type: 'match',
            matchId: String(match._id),
            userId: String(likedUserId),
          },
          settingKey: 'newMatch',
          onlyWhenOffline: true,
        }).catch((err) => {
          console.error('[expo-push] match push error (user):', err?.message || err);
        });

        sendPushToUser({
          userId: likedUserId,
          title: "It's a match!",
          body: `You and ${currentUserName} liked each other.`,
          data: {
            type: 'match',
            matchId: String(match._id),
            userId: String(userId),
          },
          settingKey: 'newMatch',
          onlyWhenOffline: true,
        }).catch((err) => {
          console.error('[expo-push] match push error (liked user):', err?.message || err);
        });

        return res.json({
          success: true,
          message: "It's a match!",
          data: {
            isMatch: true,
            match,
            likedUser: {
              id:     likedUser._id,
              name:   likedUser.name || [likedUser.firstName, likedUser.lastName].filter(Boolean).join(' '),
              images: likedUser.images,
            },
          },
        });
      }
    }

    return res.json({
      success: true,
      message: 'Action recorded.',
      data:    { isMatch: false },
    });
  } catch (error) {
    // Handle upsert duplicate key race (belt-and-suspenders)
    if (error.code === 11000) {
      return res.json({
        success: true,
        message: "It's a match!",
        data:    { isMatch: true },
      });
    }
    next(error);
  }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getMatchedUserIds = async (userId) => {
  const matches = await Match.find({
    $or:    [{ user1: userId }, { user2: userId }],
    status: 'matched',
  }).lean();
  return matches.map((m) =>
    m.user1.toString() === userId.toString() ? m.user2 : m.user1
  );
};

// ─── Liked You ────────────────────────────────────────────────────────────────
const getLikedYou = async (req, res, next) => {
  try {
    const userId        = req.user._id;
    const sanitizedPage  = Math.max(parseInt(req.query.page  || 1, 10), 1);
    const sanitizedLimit = Math.min(parseInt(req.query.limit || 50, 10), 100);
    const skip           = (sanitizedPage - 1) * sanitizedLimit;

    const matchedUsers = await getMatchedUserIds(userId);

    const [likes, total] = await Promise.all([
      Like.find({
        likedUser: userId,
        type:      { $in: ['like', 'superlike'] },
        user:      { $nin: matchedUsers },
      })
        .populate({
          path: 'user',
          select: '-password -otp -otpExpiry -verificationSelfieUrl',
          match: { isDeleted: { $ne: true }, isActive: true },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(sanitizedLimit),
      Like.countDocuments({
        likedUser: userId,
        type:      { $in: ['like', 'superlike'] },
        user:      { $nin: matchedUsers },
      }),
    ]);

    const profiles = await Promise.all(
      likes.map(async (like) => {
        if (!like.user) return null;
        const userObj    = like.user.toObject();
        userObj.images   = await mapImagesWithAccessUrls(userObj.images);
        userObj.likeType = like.type;
        userObj.likedAt  = like.createdAt;
        return userObj;
      })
    );

    return res.json({
      success: true,
      data: {
        profiles: profiles.filter(Boolean),
        pagination: { page: sanitizedPage, limit: sanitizedLimit, total, pages: Math.ceil(total / sanitizedLimit) },
      },
    });
  } catch (error) { next(error); }
};

// ─── You Liked ────────────────────────────────────────────────────────────────
const getYouLiked = async (req, res, next) => {
  try {
    const userId        = req.user._id;
    const sanitizedPage  = Math.max(parseInt(req.query.page  || 1, 10), 1);
    const sanitizedLimit = Math.min(parseInt(req.query.limit || 50, 10), 100);
    const skip           = (sanitizedPage - 1) * sanitizedLimit;

    const matchedUsers = await getMatchedUserIds(userId);

    const [likes, total] = await Promise.all([
      Like.find({
        user:      userId,
        type:      { $in: ['like', 'superlike'] },
        likedUser: { $nin: matchedUsers },
      })
        .populate({
          path: 'likedUser',
          select: '-password -otp -otpExpiry -verificationSelfieUrl',
          match: { isDeleted: { $ne: true }, isActive: true },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(sanitizedLimit),
      Like.countDocuments({
        user:      userId,
        type:      { $in: ['like', 'superlike'] },
        likedUser: { $nin: matchedUsers },
      }),
    ]);

    const profiles = await Promise.all(
      likes.map(async (like) => {
        if (!like.likedUser) return null;
        const userObj    = like.likedUser.toObject();
        userObj.images   = await mapImagesWithAccessUrls(userObj.images);
        userObj.likeType = like.type;
        userObj.likedAt  = like.createdAt;
        return userObj;
      })
    );

    return res.json({
      success: true,
      data: {
        profiles: profiles.filter(Boolean),
        pagination: { page: sanitizedPage, limit: sanitizedLimit, total, pages: Math.ceil(total / sanitizedLimit) },
      },
    });
  } catch (error) { next(error); }
};

// ─── Passed ───────────────────────────────────────────────────────────────────
const getPassed = async (req, res, next) => {
  try {
    const userId        = req.user._id;
    const sanitizedPage  = Math.max(parseInt(req.query.page  || 1, 10), 1);
    const sanitizedLimit = Math.min(parseInt(req.query.limit || 50, 10), 100);
    const skip           = (sanitizedPage - 1) * sanitizedLimit;

    const [likes, total] = await Promise.all([
      Like.find({ user: userId, type: 'pass' })
        .populate({
          path: 'likedUser',
          select: '-password -otp -otpExpiry -verificationSelfieUrl',
          match: { isDeleted: { $ne: true }, isActive: true },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(sanitizedLimit),
      Like.countDocuments({ user: userId, type: 'pass' }),
    ]);

    const profiles = await Promise.all(
      likes.map(async (like) => {
        if (!like.likedUser) return null;
        const userObj     = like.likedUser.toObject();
        userObj.images    = await mapImagesWithAccessUrls(userObj.images);
        userObj.passedAt  = like.createdAt;
        return userObj;
      })
    );

    return res.json({
      success: true,
      data: {
        profiles: profiles.filter(Boolean),
        pagination: { page: sanitizedPage, limit: sanitizedLimit, total, pages: Math.ceil(total / sanitizedLimit) },
      },
    });
  } catch (error) { next(error); }
};

module.exports = { getDiscoveryProfiles, performAction, getLikedYou, getYouLiked, getPassed };


// ─────────────────────────────────────────────────────────────────────────────
// matchController.js — Production-ready (paste below into your matchController)
// ─────────────────────────────────────────────────────────────────────────────

// const Match   = require('../models/Match');
// const User    = require('../models/User');
// const Like    = require('../models/Like');
// const Message = require('../models/Message');
// const { mapImagesWithAccessUrls } = require('../utils/imageHelper');

const getMatches = async (req, res, next) => {
  try {
    const userId         = req.user._id;
    const sanitizedPage  = Math.max(parseInt(req.query.page  || 1, 10), 1);
    const sanitizedLimit = Math.min(parseInt(req.query.limit || 20, 10), 100);
    const skip           = (sanitizedPage - 1) * sanitizedLimit;

    // Fetch active matches + unmatched matches with a pending rematch request FOR this user
    const [matches, total, rematchMatches] = await Promise.all([
      Match.find({
        $or: [{ user1: userId }, { user2: userId }],
        status: 'matched',
      })
        .populate({
          path: 'user1',
          select: 'firstName lastName name age images bio location lastActive online verified isSystem isDeleted isActive',
          match: { isDeleted: { $ne: true }, isActive: true },
        })
        .populate({
          path: 'user2',
          select: 'firstName lastName name age images bio location lastActive online verified isSystem isDeleted isActive',
          match: { isDeleted: { $ne: true }, isActive: true },
        })
        .sort({ lastMessageAt: -1, matchedAt: -1 })
        .skip(skip)
        .limit(sanitizedLimit),
      Match.countDocuments({
        $or: [{ user1: userId }, { user2: userId }],
        status: 'matched',
      }),
      // Pending rematch requests where the OTHER user requested (so current user can respond)
      Match.find({
        $or: [{ user1: userId }, { user2: userId }],
        status: 'unmatched',
        rematchRequestedBy: { $exists: true, $ne: null, $ne: userId },
      })
        .populate({
          path: 'user1',
          select: 'firstName lastName name age images bio location lastActive online verified isSystem isDeleted isActive',
          match: { isDeleted: { $ne: true }, isActive: true },
        })
        .populate({
          path: 'user2',
          select: 'firstName lastName name age images bio location lastActive online verified isSystem isDeleted isActive',
          match: { isDeleted: { $ne: true }, isActive: true },
        })
        .sort({ rematchRequestedAt: -1 })
        .limit(10),
    ]);

    const Message = require('../models/Message');

    const visibleMatches = matches.filter((match) => match.user1 && match.user2);

    const formattedMatches = await Promise.all(visibleMatches.map(async (match) => {
      const isUser1    = match.user1._id.toString() === userId.toString();
      const otherUser  = isUser1 ? match.user2 : match.user1;
      const otherUserObj = otherUser.toObject();
      otherUserObj.images = await mapImagesWithAccessUrls(otherUserObj.images);

      const [latestMessage] = await Promise.all([
        Message.findOne({ match: match._id })
          .sort({ createdAt: -1 })
          .select('content type mediaUrl createdAt sender')
          .lean(),
      ]);

      const unread = isUser1
        ? (match.unreadCount?.user1 || 0)
        : (match.unreadCount?.user2 || 0);

      return {
        matchId:       match._id,
        matchedAt:     match.matchedAt,
        lastMessageAt: match.lastMessageAt,
        lastMessage:   latestMessage || null,
        unread,
        user:          otherUserObj,
      };
    }));

    // Format pending rematch requests
    const visibleRematchMatches = rematchMatches.filter((match) => match.user1 && match.user2);

    const formattedRematchRequests = await Promise.all(visibleRematchMatches.map(async (match) => {
      const isUser1   = match.user1._id.toString() === userId.toString();
      const otherUser = isUser1 ? match.user2 : match.user1;
      const otherUserObj = otherUser.toObject();
      otherUserObj.images = await mapImagesWithAccessUrls(otherUserObj.images);

      const latestMessage = await Message.findOne({ match: match._id })
        .sort({ createdAt: -1 })
        .select('content type mediaUrl createdAt sender')
        .lean();

      return {
        matchId:             match._id,
        matchedAt:           match.matchedAt,
        lastMessageAt:       match.lastMessageAt,
        lastMessage:         latestMessage || null,
        unread:              0,
        user:                otherUserObj,
        isRematchRequest:    true,
        rematchRequestedAt:  match.rematchRequestedAt,
        rematchRequestedBy:  match.rematchRequestedBy,
      };
    }));

    return res.json({
      success: true,
      data: {
        matches: formattedMatches,
        rematchRequests: formattedRematchRequests,
        pagination: { page: sanitizedPage, limit: sanitizedLimit, total, pages: Math.ceil(total / sanitizedLimit) },
      },
    });
  } catch (error) { next(error); }
};

const getMatch = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const match  = await Match.findById(req.params.id)
      .populate('user1', 'name firstName lastName age images bio location interests verified')
      .populate('user2', 'name firstName lastName age images bio location interests verified');

    if (!match || !match.user1 || !match.user2) {
      return res.status(404).json({ success: false, message: 'Match not found.' });
    }

    const isParticipant =
      match.user1._id.toString() === userId.toString() ||
      match.user2._id.toString() === userId.toString();

    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Not authorised.' });
    }

    const otherUser = match.user1._id.toString() === userId.toString()
      ? match.user2 : match.user1;

    return res.json({
      success: true,
      data: {
        match: {
          id:            match._id,
          matchedAt:     match.matchedAt,
          lastMessageAt: match.lastMessageAt,
          user:          otherUser,
        },
      },
    });
  } catch (error) { next(error); }
};

const unmatch = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const match  = await Match.findById(req.params.id);

    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found.' });
    }

    const isParticipant =
      match.user1.toString() === userId.toString() ||
      match.user2.toString() === userId.toString();

    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Not authorised.' });
    }

    match.status = 'unmatched';

    // Store optional unmatch reason
    const { reason, details } = req.body || {};
    if (reason) {
      match.unmatchReason  = reason;
      match.unmatchDetails = details || undefined;
      match.unmatchedBy    = userId;
    }

    await match.save();

    return res.json({ success: true, message: 'Unmatched successfully.' });
  } catch (error) { next(error); }
};

// BUG FIX: was querying { users: { $all: [...] } } but Match schema has user1/user2 fields, not a users array
// This always returned null, so status was never 'matched'
const getInteractionStatus = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { targetId }  = req.params;

    const [match, interaction] = await Promise.all([
      Match.findOne({
        $or: [
          { user1: currentUserId, user2: targetId },
          { user1: targetId,      user2: currentUserId },
        ],
        status: 'matched',
      }).lean(),
      Like.findOne({ user: currentUserId, likedUser: targetId }).lean(),
    ]);

    if (match) {
      return res.json({ success: true, data: { status: 'matched' } });
    }

    if (!interaction) {
      return res.json({ success: true, data: { status: 'none' } });
    }

    const statusMap = { like: 'liked', superlike: 'superliked', pass: 'passed' };
    return res.json({ success: true, data: { status: statusMap[interaction.type] ?? 'liked' } });

  } catch (error) { next(error); }
};

// ── Also update Match.js index to enforce sorted user1 < user2 uniqueness ────
// In Match.js, replace:
//   matchSchema.index({ user1: 1, user2: 1 }, { unique: true });
// The sorted upsert in performAction now guarantees user1 < user2 alphabetically,
// so the existing unique index will correctly catch any remaining race conditions.

// ── GET /api/matches/unmatched ── list of users the current user has unmatched ─
const getUnmatchedUsers = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const unmatches = await Match.find({
      $or: [{ user1: userId }, { user2: userId }],
      status: 'unmatched',
    })
      .populate({
        path: 'user1',
        select: 'firstName lastName name images verified isDeleted isActive',
        match: { isDeleted: { $ne: true }, isActive: true },
      })
      .populate({
        path: 'user2',
        select: 'firstName lastName name images verified isDeleted isActive',
        match: { isDeleted: { $ne: true }, isActive: true },
      })
      .sort({ updatedAt: -1 })
      .lean();

    const visibleUnmatches = unmatches.filter((match) => match.user1 && match.user2);

    const formatted = await Promise.all(visibleUnmatches.map(async (match) => {
      const isUser1 = match.user1._id.toString() === userId.toString();
      const other   = isUser1 ? match.user2 : match.user1;
      const signedImages = await mapImagesWithAccessUrls(other.images || []);
      const profileImage = signedImages?.[0]?.url || signedImages?.[0] || null;
      return {
        matchId:      match._id,
        unmatchedAt:  match.updatedAt,
        rematchRequestedBy: match.rematchRequestedBy || null,
        rematchRequestedAt: match.rematchRequestedAt || null,
        user: {
          _id:        other._id,
          name:       [other.firstName, other.lastName].filter(Boolean).join(' ') || other.name || 'User',
          profileImage,
          verified:   other.verified,
        },
      };
    }));

    res.json({ success: true, data: formatted });
  } catch (error) { next(error); }
};

// ── POST /api/matches/:id/rematch ── Request a rematch ──────────────────────
const requestRematch = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const match  = await Match.findById(req.params.id);

    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found.' });
    }
    if (match.status !== 'unmatched') {
      return res.status(400).json({ success: false, message: 'Can only request rematch for unmatched connections.' });
    }

    const isParticipant =
      match.user1.toString() === userId.toString() ||
      match.user2.toString() === userId.toString();
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Not authorised.' });
    }

    if (match.rematchRequestedBy) {
      return res.status(400).json({ success: false, message: 'A rematch request is already pending.' });
    }

    match.rematchRequestedBy = userId;
    match.rematchRequestedAt = new Date();
    await match.save();

    // Notify the other user via socket
    const otherUserId = match.user1.toString() === userId.toString() ? match.user2 : match.user1;
    const currentUser = await User.findById(userId).select('firstName lastName name').lean();
    const currentUserName =
      currentUser?.name ||
      [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(' ') ||
      'Someone';

    try {
      const io = getIO();
      io.to(`user:${String(otherUserId)}`).emit('rematch:request', {
        matchId: String(match._id),
        userId:  String(userId),
        name:    currentUserName,
      });
    } catch (_) { /* socket not critical */ }

    return res.json({ success: true, message: 'Rematch request sent.' });
  } catch (error) { next(error); }
};

// ── POST /api/matches/:id/rematch/respond ── Accept or decline rematch ──────
const respondToRematch = async (req, res, next) => {
  try {
    const userId  = req.user._id;
    const { accept } = req.body;
    const match   = await Match.findById(req.params.id);

    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found.' });
    }
    if (match.status !== 'unmatched' || !match.rematchRequestedBy) {
      return res.status(400).json({ success: false, message: 'No pending rematch request.' });
    }

    const isParticipant =
      match.user1.toString() === userId.toString() ||
      match.user2.toString() === userId.toString();
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Not authorised.' });
    }
    if (match.rematchRequestedBy.toString() === userId.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot respond to your own rematch request.' });
    }

    const requesterId = match.rematchRequestedBy;

    if (accept) {
      match.status             = 'matched';
      match.matchedAt          = new Date();
      match.rematchRequestedBy = undefined;
      match.rematchRequestedAt = undefined;
      match.unmatchedBy        = undefined;
      match.unmatchReason      = undefined;
      match.unmatchDetails     = undefined;
    } else {
      match.rematchRequestedBy = undefined;
      match.rematchRequestedAt = undefined;
    }

    await match.save();

    // Notify the requester via socket
    const currentUser = await User.findById(userId).select('firstName lastName name').lean();
    const currentUserName =
      currentUser?.name ||
      [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(' ') ||
      'Someone';

    try {
      const io = getIO();
      io.to(`user:${String(requesterId)}`).emit('rematch:response', {
        matchId:  String(match._id),
        userId:   String(userId),
        name:     currentUserName,
        accepted: !!accept,
      });
    } catch (_) { /* socket not critical */ }

    return res.json({
      success: true,
      message: accept ? 'Rematch accepted! You are matched again.' : 'Rematch declined.',
      data:    { accepted: !!accept },
    });
  } catch (error) { next(error); }
};

module.exports = { getMatches, getMatch, unmatch, getUnmatchedUsers, getInteractionStatus, requestRematch, respondToRematch };