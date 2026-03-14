const Comment  = require('../models/Comment');
const Match    = require('../models/Match');
const User     = require('../models/User');
const { getIO } = require('../socket');

// Helper — send in-app socket notification to the target user if they're online.
const emitNotification = (userId, payload) => {
  try {
    const io = getIO();
    io.to(`user:${String(userId)}`).emit('notification:new', payload);
  } catch {
    // Socket may not be initialized
  }
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

    // ── Auto-match on mutual compliment ───────────────────────
    // If targetUser had already sent a compliment to fromUser → they both showed
    // interest → automatically create a match between them.
    let autoMatch = null;
    try {
      const reverseComment = await Comment.findOne({
        fromUser: targetUserId,
        toUser:   fromUserId,
      }).lean();

      if (reverseComment) {
        const existingMatch = await Match.findOne({
          $or: [
            { user1: fromUserId,   user2: targetUserId },
            { user1: targetUserId, user2: fromUserId   },
          ],
        });

        if (!existingMatch) {
          const now = new Date();
          autoMatch = await Match.create({
            user1:         fromUserId,
            user2:         targetUserId,
            status:        'matched',
            initiatedBy:   targetUserId,
            matchedAt:     now,
            lastMessageAt: now,
            unreadCount:   { user1: 1, user2: 0 },
          });
          // Notify both parties in real time
          emitNotification(String(fromUserId),   { type: 'new_match', userId: String(targetUserId) });
          emitNotification(String(targetUserId), { type: 'new_match', userId: String(fromUserId)   });
        }
      }
    } catch (matchErr) {
      console.error('[commentController] auto-match failed:', matchErr?.message);
    }

    return res.status(201).json({
      success:   true,
      data:      comment,
      autoMatch: autoMatch ? { matched: true, matchId: autoMatch._id } : null,
    });
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