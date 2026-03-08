const Match = require('../models/Match');
const User = require('../models/User');
const Message = require('../models/Message');
const { mapImagesWithAccessUrls } = require('../utils/imageHelper');

// @desc    Get all matches for current user
// @route   GET /api/matches
// @access  Private
const getMatches = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const matches = await Match.find({
      $or: [{ user1: userId }, { user2: userId }],
      status: 'matched',
    })
      .populate('user1', 'firstName lastName name age images bio location lastActive online')
      .populate('user2', 'firstName lastName name age images bio location lastActive online')
      .sort({ matchedAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    // Format matches to show the other user
    const formattedMatches = await Promise.all(matches.map(async (match) => {
      const otherUser = match.user1._id.toString() === userId.toString()
        ? match.user2
        : match.user1;

      // Regenerate image URLs
      const otherUserObj = otherUser.toObject();
      otherUserObj.images = await mapImagesWithAccessUrls(otherUserObj.images);

      const latestMessage = await Message.findOne({ match: match._id })
        .sort({ createdAt: -1 })
        .select('content type mediaUrl createdAt sender');

      const unread = match.user1._id.toString() === userId.toString()
        ? match.unreadCount?.user1 || 0
        : match.unreadCount?.user2 || 0;

      return {
        matchId: match._id,
        matchedAt: match.matchedAt,
        lastMessageAt: match.lastMessageAt,
        lastMessage: latestMessage
          ? {
              id: latestMessage._id,
              content: latestMessage.content,
              type: latestMessage.type,
              mediaUrl: latestMessage.mediaUrl,
              createdAt: latestMessage.createdAt,
              sender: latestMessage.sender,
            }
          : null,
        unread,
        user: otherUserObj,
      };
    }));

    const total = await Match.countDocuments({
      $or: [{ user1: userId }, { user2: userId }],
      status: 'matched',
    });

    res.json({
      success: true,
      data: {
        matches: formattedMatches,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single match details
// @route   GET /api/matches/:id
// @access  Private
const getMatch = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const match = await Match.findById(id)
      .populate('user1', 'name age images bio location interests')
      .populate('user2', 'name age images bio location interests');

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found',
      });
    }

    // Verify user is part of the match
    if (
      match.user1._id.toString() !== userId.toString() &&
      match.user2._id.toString() !== userId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this match',
      });
    }

    const otherUser = match.user1._id.toString() === userId.toString()
      ? match.user2
      : match.user1;

    res.json({
      success: true,
      data: {
        match: {
          id: match._id,
          matchedAt: match.matchedAt,
          lastMessageAt: match.lastMessageAt,
          user: otherUser,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Unmatch a user
// @route   DELETE /api/matches/:id
// @access  Private
const unmatch = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const match = await Match.findById(id);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found',
      });
    }

    // Verify user is part of the match
    if (
      match.user1.toString() !== userId.toString() &&
      match.user2.toString() !== userId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to unmatch',
      });
    }

    match.status = 'unmatched';
    await match.save();

    res.json({
      success: true,
      message: 'Unmatched successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMatches,
  getMatch,
  unmatch,
};
