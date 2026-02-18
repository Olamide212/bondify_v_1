const User = require('../models/User');
const Like = require('../models/Like');
const Match = require('../models/Match');

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

    // Build query
    const query = {
      _id: { $ne: userId, $nin: interactedUsers },
      isActive: true,
      onboardingCompleted: true,
      isVerified: true,
    };

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

    // Location-based filtering
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

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        profiles,
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

module.exports = {
  getDiscoveryProfiles,
  performAction,
};
