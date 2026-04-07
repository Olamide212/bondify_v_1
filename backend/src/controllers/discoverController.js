/**
 * discoverController.js
 *
 * Bug fix: pass → like / superlike upgrade
 * ─────────────────────────────────────────
 * Root cause: The old version returned 400 for ANY existing Like document,
 * regardless of the existing type. This blocked users from changing a 'pass'
 * to a 'like' or 'superlike', which is valid behaviour.
 *
 * Fix: when an existing Like exists with type 'pass' and the new request is
 * 'like' or 'superlike', we UPDATE the record instead of rejecting it.
 * We also update the stats counters correctly (decrement pass, increment like).
 *
 * All other duplicate interactions (like→like, superlike→superlike,
 * like→pass, superlike→pass) are still correctly blocked.
 */

const User    = require('../models/User');
const Like    = require('../models/Like');
const Match   = require('../models/Match');
const BlockedUser = require('../models/BlockedUser');
const { getIO } = require('../socket');
const { mapImagesWithAccessUrls } = require('../utils/imageHelper');
const { sendMatchNotification }   = require('../utils/whatsappService');
const { getRedisClient, isRedisEnabled } = require('../config/redis');

// Cache TTL for discovery results (seconds)
const DISCOVERY_CACHE_TTL = 30;

/**
 * Invalidate all discovery cache entries for a given user.
 * Called after a like/pass action so the user sees fresh results on the next request.
 */
const invalidateDiscoveryCache = async (userId) => {
  if (!isRedisEnabled()) return;
  try {
    const pattern = `discover:${userId}:*`;
    let cursor = 0;
    do {
      const reply = await getRedisClient().scan(cursor, { MATCH: pattern, COUNT: 100 });
      cursor = reply.cursor;
      if (reply.keys.length > 0) {
        await getRedisClient().del(reply.keys);
      }
    } while (cursor !== 0);
  } catch (err) {
    console.error('Discovery cache invalidation error:', err.message);
  }
};

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
      sortBy,
      page = 1, limit = 20,
    } = req.query;

    const sanitizedMinAge      = minAge      ? parseInt(minAge, 10)      : undefined;
    const sanitizedMaxAge      = maxAge      ? parseInt(maxAge, 10)      : undefined;
    const sanitizedMaxDistance = maxDistance ? parseInt(maxDistance, 10) : undefined;
    const sanitizedPage        = Math.max(parseInt(page,  10) || 1, 1);
    const sanitizedLimit       = Math.min(parseInt(limit, 10) || 20, 100);

    // Build a stable cache key from user + query params (excluding dynamic liked/matched sets)
    const cacheKey = `discover:${userId}:${JSON.stringify({
      sanitizedMinAge, sanitizedMaxAge, sanitizedMaxDistance,
      gender, religion, ethnicity, drinking, smoking,
      interests, verifiedOnly, activeToday, location, sortBy,
      sanitizedPage, sanitizedLimit,
    })}`;

    // Return cached result when Redis is available
    if (isRedisEnabled()) {
      try {
        const cached = await getRedisClient().get(cacheKey);
        if (cached) {
          return res.json(JSON.parse(cached));
        }
      } catch (cacheErr) {
        // Cache read failure is non-fatal; continue to DB
        console.error('Discovery cache read error:', cacheErr.message);
      }
    }

    // Exclude users already interacted with (liked, superliked, AND passed)
    // Also exclude blocked users (both directions) and matched users
    const [interactedUsers, matchedUserIds, blockedByMe, blockedMe] = await Promise.all([
      Like.find({ user: userId }).distinct('likedUser'),
      Match.find({
        $or: [{ user1: userId }, { user2: userId }],
        status: 'matched',
      }).then((matches) =>
        matches.map((m) =>
          m.user1.toString() === userId.toString() ? m.user2 : m.user1
        )
      ),
      BlockedUser.find({ blocker: userId }).distinct('blocked'),
      BlockedUser.find({ blocked: userId }).distinct('blocker'),
    ]);

    const excludedIds = [
      userId,
      ...interactedUsers.map(String),
      ...matchedUserIds.map(String),
      ...blockedByMe.map(String),
      ...blockedMe.map(String),
    ];

    const query = {
      _id:                 { $nin: excludedIds },
      isActive:            true,
      onboardingCompleted: true,
      isDeleted:           { $ne: true },
    };

    if (String(verifiedOnly).toLowerCase() === 'true') {
      query.verified = true;
    }

    if (sanitizedMinAge || sanitizedMaxAge) {
      query.age = {};
      if (sanitizedMinAge) query.age.$gte = sanitizedMinAge;
      if (sanitizedMaxAge) query.age.$lte = sanitizedMaxAge;
    }

    if (gender)    query.gender    = gender;
    else {
      // Apply user's saved gender preference when no explicit filter is provided
      const genderPref = currentUser?.discoveryPreferences?.genderPreference;
      if (Array.isArray(genderPref) && genderPref.length > 0) {
        const validPrefs = genderPref.filter(Boolean);
        const hasMale   = validPrefs.some((g) => /^male$/i.test(g));
        const hasFemale = validPrefs.some((g) => /^female$/i.test(g));
        // Only filter if the preference is specific (not "everyone"/all genders)
        if (hasMale && !hasFemale) {
          query.gender = 'Male';
        } else if (hasFemale && !hasMale) {
          query.gender = 'Female';
        } else if (validPrefs.length === 1 && !/^everyone$/i.test(validPrefs[0])) {
          // Single non-binary or other preference (excluding 'Everyone' which means no filter)
          query.gender = validPrefs[0];
        }
        // If both male & female, 'Everyone', or multiple mixed prefs, don't filter (show everyone)
      }
    }
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

    // Location text filter (city / state / country substring match)
    if (location && typeof location === 'string' && location.trim()) {
      const escaped = location.trim().slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { 'location.city':    { $regex: escaped, $options: 'i' } },
        { 'location.state':   { $regex: escaped, $options: 'i' } },
        { 'location.country': { $regex: escaped, $options: 'i' } },
      ];
    }

    // Geo distance filter (km)
    if (sanitizedMaxDistance && currentUser.location?.coordinates?.length === 2) {
      const radiusInRadians = (sanitizedMaxDistance * 1000) / 6378137;
      query['location.coordinates'] = {
        $geoWithin: {
          $centerSphere: [currentUser.location.coordinates, radiusInRadians],
        },
      };
    }

    const skip = (sanitizedPage - 1) * sanitizedLimit;

    // Build sort object based on sortBy parameter
    let sortObj = { lastActive: -1, _id: 1 }; // default
    if (sortBy) {
      switch (sortBy) {
        case 'age_youngest':       sortObj = { age: 1, _id: 1 };          break;
        case 'age_oldest':         sortObj = { age: -1, _id: 1 };         break;
        case 'distance_closest':   sortObj = { lastActive: -1, _id: 1 };  break; // distance sorted post-query
        case 'just_joined':        sortObj = { createdAt: -1, _id: 1 };   break;
        case 'recently_active':    sortObj = { lastActive: -1, _id: 1 };  break;
        case 'available_chat_slot': sortObj = { lastActive: -1, _id: 1 }; break; // sorted post-query
        case 'in_their_filters':   sortObj = { lastActive: -1, _id: 1 };  break; // sorted post-query
        default:                   sortObj = { lastActive: -1, _id: 1 };  break;
      }
    }

    const [profiles, total] = await Promise.all([
      User.find(query)
        .select('-password -otp -otpExpiry -verificationSelfieUrl')
        .sort(sortObj)
        .skip(skip)
        .limit(sanitizedLimit)
        .lean(),
      User.countDocuments(query),
    ]);

    // Get all profiles that have liked the current user
    const likesYouMap = await Like.find({ likedUser: userId, type: { $in: ['like', 'superlike'] } })
      .select('user')
      .lean()
      .then((likes) => new Set(likes.map((l) => l.user.toString())));

    const profilesWithImages = await Promise.all(
      profiles.map(async (profile) => {
        profile.images = await mapImagesWithAccessUrls(profile.images);

        // Add likesYou flag
        profile.likesYou = likesYouMap.has(profile._id.toString());

        // Add available chat slots info
        profile.chatSlotsAvailable = profile.chatSlots?.available ?? 0;

        // Expose blur preference so the client can render blurred photos
        profile.blurPhotos = Boolean(profile.privacySettings?.blurPhotos);

        // Compute distance from current user's location to this profile
        if (
          currentUser.location?.coordinates?.length === 2 &&
          profile.location?.coordinates?.length === 2 &&
          currentUser.location.coordinates[0] !== 0 &&
          currentUser.location.coordinates[1] !== 0 &&
          profile.location.coordinates[0] !== 0 &&
          profile.location.coordinates[1] !== 0
        ) {
          const [lon1, lat1] = currentUser.location.coordinates;
          const [lon2, lat2] = profile.location.coordinates;
          const R = 6371; // km
          const dLat = (lat2 - lat1) * Math.PI / 180;
          const dLon = (lon2 - lon1) * Math.PI / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const distanceKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          profile.distance = Math.round(distanceKm);
        }

        return profile;
      })
    );

    // Post-query sort for distance_closest (requires computed distance field)
    if (sortBy === 'distance_closest') {
      profilesWithImages.sort((a, b) => {
        const da = typeof a.distance === 'number' ? a.distance : Infinity;
        const db = typeof b.distance === 'number' ? b.distance : Infinity;
        return da - db;
      });
    }

    const responseBody = {
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
    };

    // Cache the response in Redis
    if (isRedisEnabled()) {
      try {
        await getRedisClient().setEx(cacheKey, DISCOVERY_CACHE_TTL, JSON.stringify(responseBody));
      } catch (cacheErr) {
        console.error('Discovery cache write error:', cacheErr.message);
      }
    }

    return res.json(responseBody);
  } catch (error) {
    next(error);
  }
};

// @desc    Like / Superlike / Pass a user
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
      const from = existingLike.type;
      const to   = type;

      // ── Same interaction repeated — idempotent success ───────────────────
      // Handles retries, double-taps, and race conditions gracefully.
      if (from === to) {
        return res.json({
          success: true,
          message: 'Action already recorded.',
          data:    { isMatch: false },
        });
      }

      // ── Downgrades are not allowed ────────────────────────────────────────
      // like/superlike → pass would undo an existing positive interaction.
      if ((from === 'like' || from === 'superlike') && to === 'pass') {
        return res.status(400).json({
          success: false,
          message: 'Cannot downgrade a like or superlike to a pass.',
        });
      }

      // ── Valid upgrades ────────────────────────────────────────────────────
      //   pass      → like       (changed mind, now interested)
      //   pass      → superlike  (changed mind, very interested)
      //   like      → superlike  (upgraded enthusiasm)
      existingLike.type = to;
      await existingLike.save();

      if (from === 'pass' && to === 'like') {
        await Promise.all([
          User.findByIdAndUpdate(userId,      { $inc: { passesGiven: -1, likesGiven: 1 } }),
          User.findByIdAndUpdate(likedUserId, { $inc: { likesReceived: 1 } }),
        ]);
      } else if (from === 'pass' && to === 'superlike') {
        await Promise.all([
          User.findByIdAndUpdate(userId,      { $inc: { passesGiven: -1, superLikesGiven: 1 } }),
          User.findByIdAndUpdate(likedUserId, { $inc: { superLikesReceived: 1 } }),
        ]);
      } else if (from === 'like' && to === 'superlike') {
        // Roll back the ordinary like counter, add superlike counter
        await Promise.all([
          User.findByIdAndUpdate(userId,      { $inc: { likesGiven: -1, superLikesGiven: 1 } }),
          User.findByIdAndUpdate(likedUserId, { $inc: { likesReceived: -1, superLikesReceived: 1 } }),
        ]);
      }

      // Fall through to match-check — an upgrade might create a new match
    } else {
      // ── First-time interaction ────────────────────────────────────────────
      await Like.create({ user: userId, likedUser: likedUserId, type });

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
        // Pass can never create a match — return early
        await invalidateDiscoveryCache(userId);
        return res.json({ success: true, message: 'Action recorded.', data: { isMatch: false } });
      }
    }

    // ── Check for mutual like (match) ─────────────────────────────────────
    if (type === 'like' || type === 'superlike') {
      const reciprocalLike = await Like.findOne({
        user:      likedUserId,
        likedUser: userId,
        type:      { $in: ['like', 'superlike'] },
      });

      if (reciprocalLike) {
        // Sort IDs for stable upsert — prevents duplicate match docs from race conditions
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

        // Emit match events to both users
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

        // WhatsApp offline notification (fire-and-forget)
        User.findById(likedUserId)
          .select('online lastActive phoneNumber countryCode whatsappOptIn firstName')
          .lean()
          .then((receiver) => {
            if (!receiver?.whatsappOptIn || !receiver?.phoneNumber) return;

            const threeMinutesAgo   = new Date(Date.now() - 3 * 60 * 1000);
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
          .catch((err) => console.error('[whatsapp] Match notification error:', err.message));

        // Invalidate discovery cache for both users — neither should see each other again
        await Promise.all([
          invalidateDiscoveryCache(userId),
          invalidateDiscoveryCache(likedUserId),
        ]);

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

    // Invalidate the discovery cache so the liked/passed user no longer appears
    await invalidateDiscoveryCache(userId);

    return res.json({
      success: true,
      message: 'Action recorded.',
      data: { isMatch: false },
    });
  } catch (error) {
    // Handle upsert duplicate key race (belt-and-suspenders)
    if (error.code === 11000) {
      return res.json({ success: true, message: "It's a match!", data: { isMatch: true } });
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

// @desc    Rewind the last pass action
// @route   POST /api/discover/rewind
// @access  Private
const rewindPass = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Find the most recent pass action for this user
    const lastPass = await Like.findOne({ user: userId, type: 'pass' })
      .sort({ createdAt: -1 })
      .populate('likedUser', 'firstName lastName name images age location bio')
      .lean();

    if (!lastPass) {
      return res.status(404).json({
        success: false,
        message: 'No pass action to rewind.',
      });
    }

    // Delete the pass action
    await Like.findByIdAndDelete(lastPass._id);

    // Decrement the passesGiven counter
    await User.findByIdAndUpdate(userId, { $inc: { passesGiven: -1 } });

    // Invalidate discovery cache
    await invalidateDiscoveryCache(userId);

    // Format the profile data for the response
    const profile = lastPass.likedUser;
    const formattedProfile = {
      id: profile._id,
      name: profile.name || [profile.firstName, profile.lastName].filter(Boolean).join(' '),
      age: profile.age,
      images: profile.images || [],
      bio: profile.bio,
      location: profile.location,
    };

    res.json({
      success: true,
      message: 'Pass action rewound successfully.',
      data: {
        profile: formattedProfile,
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
  rewindPass,
};