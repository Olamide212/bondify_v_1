const { Buffer } = require('buffer');
const Message = require('../models/Message');
const Match = require('../models/Match');
const { getIO } = require('../socket');

const encodeCursor = (message) => {
  if (!message?._id || !message?.createdAt) return null;
  return Buffer.from(
    JSON.stringify({
      id: String(message._id),
      createdAt: message.createdAt.toISOString(),
    })
  ).toString('base64');
};

const decodeCursor = (cursor) => {
  if (!cursor) return null;

  try {
    const parsed = JSON.parse(Buffer.from(cursor, 'base64').toString('utf8'));
    if (!parsed?.id || !parsed?.createdAt) return null;
    return parsed;
  } catch (_) {
    return null;
  }
};

// @desc    Get messages for a match
// @route   GET /api/messages/:matchId
// @access  Private
const getMessages = async (req, res, next) => {
  try {
    const io = getIO();
    const userId = req.user._id;
    const { matchId } = req.params;
    const { page = 1, limit = 50, cursor } = req.query;

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

    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
    const parsedCursor = decodeCursor(cursor);

    const query = { match: matchId };

    if (parsedCursor) {
      const cursorDate = new Date(parsedCursor.createdAt);
      query.$or = [
        { createdAt: { $lt: cursorDate } },
        { createdAt: cursorDate, _id: { $lt: parsedCursor.id } },
      ];
    }

    const messages = await Message.find(query)
      .populate('sender', 'firstName lastName name images')
      .populate('receiver', 'firstName lastName name images')
      .sort({ createdAt: -1 })
      .limit(parsedLimit + 1);

    const hasMore = messages.length > parsedLimit;
    const paginatedMessages = hasMore ? messages.slice(0, parsedLimit) : messages;

    const total = cursor ? undefined : await Message.countDocuments({ match: matchId });

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

    if (match.user1.toString() === userId.toString()) {
      match.unreadCount.user1 = 0;
    } else {
      match.unreadCount.user2 = 0;
    }
    await match.save();

    io.to(`user:${String(match.user1)}`).emit('messages:read', {
      matchId,
      byUserId: String(userId),
      readAt: new Date().toISOString(),
    });
    io.to(`user:${String(match.user2)}`).emit('messages:read', {
      matchId,
      byUserId: String(userId),
      readAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      data: {
        messages: paginatedMessages.reverse(), // Return in chronological order
        pagination: {
          page: parseInt(page, 10),
          limit: parsedLimit,
          total,
          pages: total !== undefined ? Math.ceil(total / parsedLimit) : undefined,
          hasMore,
          nextCursor: hasMore
            ? encodeCursor(paginatedMessages[paginatedMessages.length - 1])
            : null,
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
    const io = getIO();
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

    if (match.user1.toString() === receiverId.toString()) {
      match.unreadCount.user1 = (match.unreadCount.user1 || 0) + 1;
    } else {
      match.unreadCount.user2 = (match.unreadCount.user2 || 0) + 1;
    }

    await match.save();

    // Populate message
    await message.populate('sender', 'firstName lastName name images');
    await message.populate('receiver', 'firstName lastName name images');

    const messagePayload = message.toObject();

    io.to(`match:${matchId}`).emit('message:new', {
      matchId,
      message: messagePayload,
    });
    io.to(`user:${String(receiverId)}`).emit('message:new', {
      matchId,
      message: messagePayload,
    });

    // Notify sender that message was delivered
    io.to(`user:${String(userId)}`).emit('message:delivered', {
      matchId,
      messageId: String(message._id),
      deliveredAt: new Date().toISOString(),
    });

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: { message: messagePayload },
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
