const Message = require('../models/Message');
const Match = require('../models/Match');

// @desc    Get messages for a match
// @route   GET /api/messages/:matchId
// @access  Private
const getMessages = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { matchId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Verify match exists and user is part of it
    const match = await Match.findById(matchId);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found',
      });
    }

    if (
      match.user1.toString() !== userId.toString() &&
      match.user2.toString() !== userId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these messages',
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const messages = await Message.find({ match: matchId })
      .populate('sender', 'name images')
      .populate('receiver', 'name images')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Message.countDocuments({ match: matchId });

    // Mark messages as read
    await Message.updateMany(
      {
        match: matchId,
        receiver: userId,
        read: false,
      },
      {
        read: true,
        readAt: new Date(),
      }
    );

    res.json({
      success: true,
      data: {
        messages: messages.reverse(), // Return in chronological order
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

// @desc    Send a message
// @route   POST /api/messages/:matchId
// @access  Private
const sendMessage = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { matchId } = req.params;
    const { content, type = 'text', mediaUrl } = req.body;

    if (!content && !mediaUrl) {
      return res.status(400).json({
        success: false,
        message: 'Message content or media is required',
      });
    }

    // Verify match exists and user is part of it
    const match = await Match.findById(matchId);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found',
      });
    }

    if (
      match.user1.toString() !== userId.toString() &&
      match.user2.toString() !== userId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to send messages in this match',
      });
    }

    // Determine receiver
    const receiverId = match.user1.toString() === userId.toString()
      ? match.user2
      : match.user1;

    // Create message
    const message = await Message.create({
      match: matchId,
      sender: userId,
      receiver: receiverId,
      content,
      type,
      mediaUrl,
      delivered: true,
      deliveredAt: new Date(),
    });

    // Update match last message time
    match.lastMessageAt = new Date();
    await match.save();

    // Populate message
    await message.populate('sender', 'name images');
    await message.populate('receiver', 'name images');

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: { message },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a message
// @route   DELETE /api/messages/:messageId
// @access  Private
const deleteMessage = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { messageId } = req.params;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    // Only sender can delete their message
    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this message',
      });
    }

    await message.deleteOne();

    res.json({
      success: true,
      message: 'Message deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMessages,
  sendMessage,
  deleteMessage,
};
