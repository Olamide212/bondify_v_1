const Comment  = require('../models/Comment');
const User     = require('../models/User');

// Helper — send in-app socket notification to the target user if they're online.
// Adjust the import path to wherever your socketService / io instance lives.
let io;
try { io = require('../socket').io; } catch { io = null; }

const emitNotification = (userId, payload) => {
  if (!io) return;
  io.to(String(userId)).emit('notification:new', payload);
};

// ─────────────────────────────────────────────────────────────────────────────

// @desc    Send a photo comment to another user
// @route   POST /api/comments
// @access  Private
const sendComment = async (req, res, next) => {
  try {
    const fromUserId = req.user._id;
    const { targetUserId, imageIndex = 0, imageUrl, content } = req.body;

    if (!targetUserId || !content?.trim()) {
      return res.status(400).json({ success: false, message: 'targetUserId and content are required.' });
    }

    if (String(fromUserId) === String(targetUserId)) {
      return res.status(400).json({ success: false, message: 'You cannot comment on your own photo.' });
    }

    const comment = await Comment.create({
      fromUser:   fromUserId,
      toUser:     targetUserId,
      imageIndex: Number(imageIndex) || 0,
      imageUrl:   imageUrl || null,
      content:    content.trim(),
    });

    // Populate sender info for the notification payload
    const populated = await comment.populate('fromUser', 'firstName profilePhoto');

    // ── Real-time notification ────────────────────────────────
    emitNotification(targetUserId, {
      type:      'photo_comment',
      commentId: comment._id,
      fromUser: {
        id:    populated.fromUser._id,
        name:  populated.fromUser.firstName,
        photo: populated.fromUser.profilePhoto,
      },
      imageIndex,
      imageUrl,
      content:   content.trim(),
      createdAt: comment.createdAt,
    });

    return res.status(201).json({ success: true, data: comment });
  } catch (error) {
    next(error);
  }
};

// @desc    Get comments received by the current user (inbox)
// @route   GET /api/comments/received
// @access  Private
const getReceivedComments = async (req, res, next) => {
  try {
    const comments = await Comment.find({ toUser: req.user._id })
      .sort({ createdAt: -1 })
      .populate('fromUser', 'firstName profilePhoto verified')
      .limit(50)
      .lean();

    return res.json({ success: true, data: comments });
  } catch (error) {
    next(error);
  }
};

// @desc    Get comments sent by the current user
// @route   GET /api/comments/sent
// @access  Private
const getSentComments = async (req, res, next) => {
  try {
    const comments = await Comment.find({ fromUser: req.user._id })
      .sort({ createdAt: -1 })
      .populate('toUser', 'firstName profilePhoto')
      .limit(50)
      .lean();

    return res.json({ success: true, data: comments });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark a comment as read
// @route   PATCH /api/comments/:id/read
// @access  Private
const markRead = async (req, res, next) => {
  try {
    const comment = await Comment.findOneAndUpdate(
      { _id: req.params.id, toUser: req.user._id },
      { read: true },
      { new: true }
    );
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found.' });
    return res.json({ success: true, data: comment });
  } catch (error) {
    next(error);
  }
};

module.exports = { sendComment, getReceivedComments, getSentComments, markRead };