const User = require('../models/User');
const Like = require('../models/Like');
const Match = require('../models/Match');
const { mapImagesWithAccessUrls } = require('../utils/imageHelper');

// @desc    Get discovery profiles
// @route   GET /api/discover
// @access  Private
const getDiscoveryProfiles = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const currentUser = await User.findById(userId);

    const {
      minAge,
      maxAge,
      maxDistance,
      gender,
      religion,
      ethnicity,
      drinking,
      smoking,
      interests,
      verifiedOnly,
      activeToday,
      location,
      page = 1,
      limit = 20,
    } = req.query;

    // Validate and sanitize numeric inputs
    const sanitizedMinAge = minAge ? parseInt(minAge, 10) : undefined;
    const sanitizedMaxAge = maxAge ? parseInt(maxAge, 10) : undefined;
    const sanitizedMaxDistance = maxDistance ? parseInt(maxDistance, 10) : undefined;
    const sanitizedPage = parseInt(page, 10) || 1;
    const sanitizedLimit = Math.min(parseInt(limit, 10) || 20, 100); // Max 100

    // Get users that current user has already interacted with
    const interactedUsers = await Like.find({ user: userId }).distinct('likedUser');

    // Build query – only show users who finished onboarding
    const query = {
      _id: { $ne: userId, $nin: interactedUsers },
      isActive: true,
      onboardingCompleted: true,
    };

    if (String(verifiedOnly).toLowerCase() === 'true') {
      query.isVerified = true;
    }

    // Apply filters
    if (sanitizedMinAge || sanitizedMaxAge) {
      query.age = {};
      if (sanitizedMinAge) query.age.$gte = sanitizedMinAge;
      if (sanitizedMaxAge) query.age.$lte = sanitizedMaxAge;
    }

    if (gender) {
      query.gender = gender;
    }

    if (religion) {
      query.religion = religion;
    }

    if (ethnicity) {
      query.ethnicity = ethnicity;
    }

    if (drinking) {
      query.drinking = drinking;
    }

    if (smoking) {
      query.smoking = smoking;
    }

    if (interests) {
      const interestArray = Array.isArray(interests) ? interests : [interests];
      query.interests = { $in: interestArray };
    }

    // Active-today filter
    if (String(activeToday).toLowerCase() === 'true') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      query.lastActive = { $gte: startOfDay };
    }

    // Text-based location filter (city / state / country)
    if (location && typeof location === 'string' && location.trim()) {
      const escapedLocation = location.trim().slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { 'location.city': { $regex: escapedLocation, $options: 'i' } },
        { 'location.state': { $regex: escapedLocation, $options: 'i' } },
        { 'location.country': { $regex: escapedLocation, $options: 'i' } },
      ];
    }

    // Geolocation-based distance filtering
    if (sanitizedMaxDistance && currentUser.location?.coordinates) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: currentUser.location.coordinates,
          },
          $maxDistance: sanitizedMaxDistance * 1000, // Convert km to meters
        },
      };
    }

    const skip = (sanitizedPage - 1) * sanitizedLimit;

    const profiles = await User.find(query)
      .select('-password -otp -otpExpiry')
      .limit(sanitizedLimit)
      .skip(skip)
      .sort({ lastActive: -1 });

    // Regenerate image URLs for each profile
    const profilesWithImages = await Promise.all(
      profiles.map(async (profile) => {
        const profileObj = profile.toObject();
        profileObj.images = await mapImagesWithAccessUrls(profileObj.images);
        return profileObj;
      })
    );

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        profiles: profilesWithImages,
        pagination: {
          page: sanitizedPage,
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
    const { likedUserId, type } = req.body; // type: 'like', 'superlike', 'pass'

    if (!['like', 'superlike', 'pass'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action type',
      });
    }

    const likedUser = await User.findById(likedUserId);

    if (!likedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if already interacted
    const existingLike = await Like.findOne({
      user: userId,
      likedUser: likedUserId,
    });

    if (existingLike) {
      return res.status(400).json({
        success: false,
        message: 'Already interacted with this user',
      });
    }

    // Create like/pass record
    const like = await Like.create({
      user: userId,
      likedUser: likedUserId,
      type,
    });

    // Update stats
    const currentUser = await User.findById(userId);
    if (type === 'like') {
      currentUser.likesGiven += 1;
      likedUser.likesReceived += 1;
    } else if (type === 'superlike') {
      currentUser.superLikesGiven += 1;
      likedUser.superLikesReceived += 1;
    }

    await currentUser.save();
    await likedUser.save();

    // Check for mutual like (match)
    let isMatch = false;
    if (type === 'like' || type === 'superlike') {
      const reciprocalLike = await Like.findOne({
        user: likedUserId,
        likedUser: userId,
        type: { $in: ['like', 'superlike'] },
      });

      if (reciprocalLike) {
        // Create match
        const match = await Match.create({
          user1: userId,
          user2: likedUserId,
          status: 'matched',
          initiatedBy: userId,
          matchedAt: new Date(),
        });

        isMatch = true;

        return res.json({
          success: true,
          message: "It's a match!",
          data: {
            isMatch: true,
            match,
            likedUser: {
              id: likedUser._id,
              name: likedUser.name,
              images: likedUser.images,
            },
          },
        });
      }
    }

    res.json({
      success: true,
      message: 'Action recorded successfully',
      data: {
        isMatch: false,
        like,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Helper to get list of user IDs already matched with the current user
const getMatchedUserIds = async (userId) => {
  const matches = await Match.find({
    $or: [{ user1: userId }, { user2: userId }],
    status: 'matched',
  });
  return matches.map((m) =>
    m.user1.toString() === userId.toString() ? m.user2 : m.user1
  );
};

// @desc    Get users who liked the current user
// @route   GET /api/discover/liked-you
// @access  Private
const getLikedYou = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 50 } = req.query;
    const sanitizedPage = parseInt(page, 10) || 1;
    const sanitizedLimit = Math.min(parseInt(limit, 10) || 50, 100);
    const skip = (sanitizedPage - 1) * sanitizedLimit;

    const matchedUsers = await getMatchedUserIds(userId);

    const likes = await Like.find({
      likedUser: userId,
      type: { $in: ['like', 'superlike'] },
      user: { $nin: matchedUsers },
    })
      .populate('user', '-password -otp -otpExpiry')
      .sort({ createdAt: -1 })
      .limit(sanitizedLimit)
      .skip(skip);

    const total = await Like.countDocuments({
      likedUser: userId,
      type: { $in: ['like', 'superlike'] },
      user: { $nin: matchedUsers },
    });

    const profiles = await Promise.all(
      likes.map(async (like) => {
        if (!like.user) return null;
        const userObj = like.user.toObject();
        userObj.images = await mapImagesWithAccessUrls(userObj.images);
        return {
          ...userObj,
          likeType: like.type,
          likedAt: like.createdAt,
        };
      })
    );

    res.json({
      success: true,
      data: {
        profiles: profiles.filter(Boolean),
        pagination: {
          page: sanitizedPage,
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
    const userId = req.user._id;
    const { page = 1, limit = 50 } = req.query;
    const sanitizedPage = parseInt(page, 10) || 1;
    const sanitizedLimit = Math.min(parseInt(limit, 10) || 50, 100);
    const skip = (sanitizedPage - 1) * sanitizedLimit;

    const matchedUsers = await getMatchedUserIds(userId);

    const likes = await Like.find({
      user: userId,
      type: { $in: ['like', 'superlike'] },
      likedUser: { $nin: matchedUsers },
    })
      .populate('likedUser', '-password -otp -otpExpiry')
      .sort({ createdAt: -1 })
      .limit(sanitizedLimit)
      .skip(skip);

    const total = await Like.countDocuments({
      user: userId,
      type: { $in: ['like', 'superlike'] },
      likedUser: { $nin: matchedUsers },
    });

    const profiles = await Promise.all(
      likes.map(async (like) => {
        if (!like.likedUser) return null;
        const userObj = like.likedUser.toObject();
        userObj.images = await mapImagesWithAccessUrls(userObj.images);
        return {
          ...userObj,
          likeType: like.type,
          likedAt: like.createdAt,
        };
      })
    );

    res.json({
      success: true,
      data: {
        profiles: profiles.filter(Boolean),
        pagination: {
          page: sanitizedPage,
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
    const userId = req.user._id;
    const { page = 1, limit = 50 } = req.query;
    const sanitizedPage = parseInt(page, 10) || 1;
    const sanitizedLimit = Math.min(parseInt(limit, 10) || 50, 100);
    const skip = (sanitizedPage - 1) * sanitizedLimit;

    const likes = await Like.find({
      user: userId,
      type: 'pass',
    })
      .populate('likedUser', '-password -otp -otpExpiry')
      .sort({ createdAt: -1 })
      .limit(sanitizedLimit)
      .skip(skip);

    const total = await Like.countDocuments({
      user: userId,
      type: 'pass',
    });

    const profiles = await Promise.all(
      likes.map(async (like) => {
        if (!like.likedUser) return null;
        const userObj = like.likedUser.toObject();
        userObj.images = await mapImagesWithAccessUrls(userObj.images);
        return {
          ...userObj,
          passedAt: like.createdAt,
        };
      })
    );

    res.json({
      success: true,
      data: {
        profiles: profiles.filter(Boolean),
        pagination: {
          page: sanitizedPage,
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
