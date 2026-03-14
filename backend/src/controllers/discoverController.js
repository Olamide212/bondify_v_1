const User    = require('../models/User');
const Like    = require('../models/Like');
const Match   = require('../models/Match');
const { getIO } = require('../socket');
const { mapImagesWithAccessUrls } = require('../utils/imageHelper');
const { sendMatchNotification }   = require('../utils/whatsappService');

// @desc    Get discovery profiles
// @route   GET /api/discover
// @access  Private
const getDiscoveryProfiles = async (req, res, next) => {
  try {
    const userId      = req.user._id;
    const currentUser = await User.findById(userId).lean();

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

    // Exclude users already liked/superliked (but allow passed users to be seen again)
    const [likedUsers, matchedUserIds] = await Promise.all([
      Like.find({ user: userId, type: { $in: ['like', 'superlike'] } }).distinct('likedUser'),
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
      ...likedUsers.map(String),
      ...matchedUserIds.map(String),
    ];

    const query = {
      _id:                 { $nin: excludedIds },
      isActive:            true,
      onboardingCompleted: true,
      isDeleted:           { $ne: true },
    };

    // FIX: was querying isVerified (OTP field) — should be verified (identity badge)
    if (String(verifiedOnly).toLowerCase() === 'true') {
      query.verified = true;
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

    // FIX: run find + count in parallel; add _id tiebreaker for stable pagination
    // Explicitly exclude sensitive fields but include voicePrompt
    const [profiles, total] = await Promise.all([
      User.find(query)
        .select('-password -otp -otpExpiry -verificationSelfieUrl')
        .sort({ lastActive: -1, _id: 1 })
        .skip(skip)
        .limit(sanitizedLimit)
        .lean(),
      User.countDocuments(query),
    ]);

    const profilesWithImages = await Promise.all(
      profiles.map(async (profile) => {
        profile.images = await mapImagesWithAccessUrls(profile.images);
        return profile;
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

// @desc    Like/Pass a user
// @route   POST /api/discover/action
// @access  Private
const performAction = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { likedUserId, type } = req.body;

    if (!['like', 'superlike', 'pass'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid action type.' });
    }

    const likedUser = await User.findById(likedUserId);
    if (!likedUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const existingLike = await Like.findOne({ user: userId, likedUser: likedUserId });
    if (existingLike) {
      // Allow changing a 'pass' to 'like' or 'superlike' (user changed their mind)
      if (existingLike.type === 'pass' && (type === 'like' || type === 'superlike')) {
        // Update the existing pass to a like/superlike
        existingLike.type = type;
        await existingLike.save();

        // Update stats: decrement passGiven, increment likesGiven/superLikesGiven
        if (type === 'like') {
          await Promise.all([
            User.findByIdAndUpdate(userId,      { $inc: { passesGiven: -1, likesGiven: 1 } }),
            User.findByIdAndUpdate(likedUserId, { $inc: { likesReceived: 1 } }),
          ]);
        } else if (type === 'superlike') {
          await Promise.all([
            User.findByIdAndUpdate(userId,      { $inc: { passesGiven: -1, superLikesGiven: 1 } }),
            User.findByIdAndUpdate(likedUserId, { $inc: { superLikesReceived: 1 } }),
          ]);
        }
      } else {
        // Block other duplicate interactions (like->like, superlike->superlike, etc.)
        return res.status(400).json({
          success: false,
          message: `Already interacted with this user (existing: ${existingLike.type}, requested: ${type}).`
        });
      }
    } else {
      // No existing interaction, create new one
      await Like.create({ user: userId, likedUser: likedUserId, type });

      // Update stats based on type
      if (type === 'like') {
        await Promise.all([
          User.findByIdAndUpdate(userId,      { $inc: { likesGiven: 1 } }),
          User.findByIdAndUpdate(likedUserId, { $inc: { likesReceived: 1 } }),
        ]);
      } else if (type === 'superlike') {
        await Promise.all([
          User.findByIdAndUpdate(userId,      { $inc: { superLikesGiven: 1 } }),
          User.findByIdAndUpdate(likedUserId, { $inc: { superLikesReceived: 1 } }),
        ]);
      } else if (type === 'pass') {
        await User.findByIdAndUpdate(userId, { $inc: { passesGiven: 1 } });
      }
    }

    if (type === 'like' || type === 'superlike') {
      const reciprocalLike = await Like.findOne({
        user:      likedUserId,
        likedUser: userId,
        type:      { $in: ['like', 'superlike'] },
      });

      if (reciprocalLike) {
        // FIX: sort user IDs so user1 < user2 always — prevents duplicate matches
        // from race conditions where both users swipe at the same time.
        // findOneAndUpdate + upsert means the second request just gets the existing doc.
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

        const currentUser = await User.findById(userId)
          .select('firstName lastName name')
          .lean();

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
        });
        io.to(`user:${String(likedUserId)}`).emit('match:new', {
          ...basePayload,
          id:     `match-${match._id}-${likedUserId}`,
          userId: String(userId),
          title:  "It's a match!",
          body:   `You and ${currentUserName} liked each other.`,
        });
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

        // ── WhatsApp offline notification (fire-and-forget) ───────────────
        User.findById(likedUserId)
          .select('online lastActive phoneNumber countryCode whatsappOptIn firstName')
          .lean()
          .then((receiver) => {
            if (!receiver || !receiver.whatsappOptIn || !receiver.phoneNumber) return;

            const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);
            const effectivelyOnline =
              receiver.online === true &&
              receiver.lastActive &&
              new Date(receiver.lastActive) > threeMinutesAgo;

            if (effectivelyOnline) return;

            const phone = `+${(receiver.countryCode || '').replace('+', '')}${receiver.phoneNumber.replace(/\D/g, '')}`;

            sendMatchNotification({
              toPhone:       phone,
              recipientName: receiver.firstName || 'there',
              matchedName:   currentUserName,
              matchId:       String(match._id),
            });
          })
          .catch((err) => {
            console.error('[whatsapp] Match notification error:', err.message);
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
      message: 'Action recorded successfully',
      data: { isMatch: false },
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

// ── Helper ────────────────────────────────────────────────────────────────────
const getMatchedUserIds = async (userId) => {
  const matches = await Match.find({
    $or:    [{ user1: userId }, { user2: userId }],
    status: 'matched',
  }).lean();
  return matches.map((m) =>
    m.user1.toString() === userId.toString() ? m.user2 : m.user1
  );
};

// @desc    Get users who liked the current user
// @route   GET /api/discover/liked-you
// @access  Private
const getLikedYou = async (req, res, next) => {
  try {
    const userId         = req.user._id;
    const sanitizedPage  = Math.max(parseInt(req.query.page  || 1,  10), 1);
    const sanitizedLimit = Math.min(parseInt(req.query.limit || 50, 10), 100);
    const skip           = (sanitizedPage - 1) * sanitizedLimit;

    const matchedUsers = await getMatchedUserIds(userId);

    const [likes, total] = await Promise.all([
      Like.find({
        likedUser: userId,
        type:      { $in: ['like', 'superlike'] },
        user:      { $nin: matchedUsers },
      })
        .populate('user', '-password -otp -otpExpiry -verificationSelfieUrl')
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

// @desc    Get users the current user liked
// @route   GET /api/discover/you-liked
// @access  Private
const getYouLiked = async (req, res, next) => {
  try {
    const userId         = req.user._id;
    const sanitizedPage  = Math.max(parseInt(req.query.page  || 1,  10), 1);
    const sanitizedLimit = Math.min(parseInt(req.query.limit || 50, 10), 100);
    const skip           = (sanitizedPage - 1) * sanitizedLimit;

    const matchedUsers = await getMatchedUserIds(userId);

    const [likes, total] = await Promise.all([
      Like.find({
        user:      userId,
        type:      { $in: ['like', 'superlike'] },
        likedUser: { $nin: matchedUsers },
      })
        .populate('likedUser', '-password -otp -otpExpiry -verificationSelfieUrl')
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

// @desc    Get users the current user passed on
// @route   GET /api/discover/passed
// @access  Private
const getPassed = async (req, res, next) => {
  try {
    const userId         = req.user._id;
    const sanitizedPage  = Math.max(parseInt(req.query.page  || 1,  10), 1);
    const sanitizedLimit = Math.min(parseInt(req.query.limit || 50, 10), 100);
    const skip           = (sanitizedPage - 1) * sanitizedLimit;

    const [likes, total] = await Promise.all([
      Like.find({ user: userId, type: 'pass' })
        .populate('likedUser', '-password -otp -otpExpiry -verificationSelfieUrl')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(sanitizedLimit),
      Like.countDocuments({ user: userId, type: 'pass' }),
    ]);

    const profiles = await Promise.all(
      likes.map(async (like) => {
        if (!like.likedUser) return null;
        const userObj    = like.likedUser.toObject();
        userObj.images   = await mapImagesWithAccessUrls(userObj.images);
        userObj.passedAt = like.createdAt;
        return userObj;
      })
    );

    return res.json({
      success: true,
      data: {
        profiles: profiles.filter(Boolean),
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

module.exports = {
  getDiscoveryProfiles,
  performAction,
  getLikedYou,
  getYouLiked,
  getPassed,
};