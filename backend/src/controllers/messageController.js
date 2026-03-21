const { Buffer } = require('buffer');
const Message = require('../models/Message');
const Match = require('../models/Match');
const User = require('../models/User');
const { getIO } = require('../socket');
const { sendMessageNotification } = require('../utils/whatsappService');

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
      { match: matchId, receiver: userId, read: false },
      { read: true, readAt: new Date() }
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
        messages: paginatedMessages.reverse(),
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
    const { content, type = 'text', mediaUrl, mediaDuration } = req.body;
    const normalizedContent = typeof content === 'string' ? content.trim() : '';

    if (type === 'text' && !normalizedContent) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required',
      });
    }

    if (type !== 'text' && !mediaUrl && !normalizedContent) {
      return res.status(400).json({
        success: false,
        message: 'Message content or media is required',
      });
    }

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
    const sendMessage = async (req, res, next) => {
      try {
        const io = getIO();
        const userId = req.user._id;
        const { matchId } = req.params;
        const { content, type = 'text', mediaUrl, mediaDuration, replyTo } = req.body;
        const normalizedContent = typeof content === 'string' ? content.trim() : '';
        if (type === 'text' && !normalizedContent) {
          return res.status(400).json({
            success: false,
            message: 'Message content is required',
          });
        }
        if (type !== 'text' && !mediaUrl && !normalizedContent) {
          return res.status(400).json({
            success: false,
            message: 'Message content or media is required',
          });
        }
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
          content: normalizedContent,
          type,
          mediaUrl,
          mediaDuration,
          replyTo: replyTo || null,
          delivered: true,
          deliveredAt: new Date(),
        });
        // Update match
        match.lastMessageAt = new Date();
        if (match.user1.toString() === receiverId.toString()) {
          match.unreadCount.user1 = (match.unreadCount.user1 || 0) + 1;
        } else {
          match.unreadCount.user2 = (match.unreadCount.user2 || 0) + 1;
        }
        await match.save();
        await message.populate('sender', 'firstName lastName name images');
        await message.populate('receiver', 'firstName lastName name images');
        const messagePayload = message.toObject();
        const senderName =
          messagePayload?.sender?.name ||
          [messagePayload?.sender?.firstName, messagePayload?.sender?.lastName]
            .filter(Boolean)
            .join(' ') ||
          'Someone';
        const notificationBody =
          type === 'image' ? 'Sent you a photo'
          : type === 'voice' ? 'Sent you a voice note'
          : normalizedContent || 'Sent you a message';
        // ── Socket emits ──────────────────────────────────────────────────────────
        io.to(`match:${matchId}`).emit('message:new', { matchId, message: messagePayload });
        io.to(`user:${String(receiverId)}`).emit('message:new', { matchId, message: messagePayload });
        io.to(`user:${String(receiverId)}`).emit('notification:new', {
          id:        String(message._id),
          type:      'message',
          matchId:   String(matchId),
          title:     senderName,
          body:      notificationBody,
          createdAt: new Date().toISOString(),
          senderId:  String(userId),
        });
        io.to(`user:${String(userId)}`).emit('message:delivered', {
          matchId,
          messageId:   String(message._id),
          deliveredAt: new Date().toISOString(),
        });
        // ── WhatsApp offline notification (fire-and-forget) ───────────────────────
        User.findById(receiverId)
          .select('online lastActive phoneNumber countryCode whatsappOptIn firstName')
          .lean()
          .then((receiver) => {
            if (!receiver) return;
            if (!receiver.whatsappOptIn) return;
            if (!receiver.phoneNumber) return;
            const countryCode = (receiver.countryCode || '').replace('+', '');
            const phone       = receiver.phoneNumber.replace(/\D/g, '');
            const fullPhone   = `+${countryCode}${phone}`;
            sendMessageNotification({
              toPhone:        fullPhone,
              recipientName:  receiver.firstName || 'there',
              senderName,
              matchId:        String(matchId),
              messagePreview: normalizedContent,
              messageType:    type,
            });
          })
          .catch((err) => {
            console.error('[whatsapp] Offline check error:', err.message);
          });
        return res.status(201).json({
          success: true,
          message: 'Message sent successfully',
          data: { message: messagePayload },
        });
      } catch (error) {
        next(error);
      }
      receiver: receiverId,
      content: normalizedContent,
      type,
      mediaUrl,
      mediaDuration,
      delivered: true,
      deliveredAt: new Date(),
    });

    // Update match
    match.lastMessageAt = new Date();
    if (match.user1.toString() === receiverId.toString()) {
      match.unreadCount.user1 = (match.unreadCount.user1 || 0) + 1;
    } else {
      match.unreadCount.user2 = (match.unreadCount.user2 || 0) + 1;
    }
    await match.save();

    await message.populate('sender', 'firstName lastName name images');
    await message.populate('receiver', 'firstName lastName name images');

    const messagePayload = message.toObject();

    const senderName =
      messagePayload?.sender?.name ||
      [messagePayload?.sender?.firstName, messagePayload?.sender?.lastName]
        .filter(Boolean)
        .join(' ') ||
      'Someone';

    const notificationBody =
      type === 'image' ? 'Sent you a photo'
      : type === 'voice' ? 'Sent you a voice note'
      : normalizedContent || 'Sent you a message';

    // ── Socket emits ──────────────────────────────────────────────────────────
    io.to(`match:${matchId}`).emit('message:new', { matchId, message: messagePayload });
    io.to(`user:${String(receiverId)}`).emit('message:new', { matchId, message: messagePayload });
    io.to(`user:${String(receiverId)}`).emit('notification:new', {
      id:        String(message._id),
      type:      'message',
      matchId:   String(matchId),
      title:     senderName,
      body:      notificationBody,
      createdAt: new Date().toISOString(),
      senderId:  String(userId),
    });
    io.to(`user:${String(userId)}`).emit('message:delivered', {
      matchId,
      messageId:   String(message._id),
      deliveredAt: new Date().toISOString(),
    });

    // ── WhatsApp offline notification (fire-and-forget) ───────────────────────
    // Only fires if receiver is offline AND has opted in to WhatsApp notifications
    User.findById(receiverId)
      .select('online lastActive phoneNumber countryCode whatsappOptIn firstName')
      .lean()
      .then((receiver) => {
        if (!receiver) return;
        if (!receiver.whatsappOptIn) return;
        if (!receiver.phoneNumber) return;

        // Treat user as offline if online flag is false OR last active > 3 mins ago
        const threeMinutesAgo  = new Date(Date.now() - 3 * 60 * 1000);
        const effectivelyOnline =
          receiver.online === true &&
          receiver.lastActive &&
          new Date(receiver.lastActive) > threeMinutesAgo;

        if (effectivelyOnline) return;

        const countryCode = (receiver.countryCode || '').replace('+', '');
        const phone       = receiver.phoneNumber.replace(/\D/g, '');
        const fullPhone   = `+${countryCode}${phone}`;

        sendMessageNotification({
          toPhone:        fullPhone,
          recipientName:  receiver.firstName || 'there',
          senderName,
          matchId:        String(matchId),
          messagePreview: normalizedContent,
          messageType:    type,
        });
      })
      .catch((err) => {
        console.error('[whatsapp] Offline check error:', err.message);
      });

    return res.status(201).json({
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

// @desc    Send a direct message to any user (no match required)
// @route   POST /api/messages/direct/:userId
// @access  Private
const sendDirectMessage = async (req, res, next) => {
  try {
    const io = getIO();
    const senderId = req.user._id;
    const { userId: receiverId } = req.params;
    const { content, type = 'text' } = req.body;
    const normalizedContent = typeof content === 'string' ? content.trim() : '';

    if (!normalizedContent) {
      return res.status(400).json({ success: false, message: 'Message content is required.' });
    }

    if (String(senderId) === String(receiverId)) {
      return res.status(400).json({ success: false, message: 'Cannot send a message to yourself.' });
    }

    const receiver = await User.findById(receiverId).select('firstName lastName name online').lean();
    if (!receiver) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Find or create a pending conversation between the two users (order-stable key)
    const [u1, u2] = [String(senderId), String(receiverId)].sort();
    let match = await Match.findOneAndUpdate(
      { user1: u1, user2: u2 },
      {
        $setOnInsert: {
          user1:       u1,
          user2:       u2,
          status:      'pending',
          initiatedBy: senderId,
        },
      },
      { upsert: true, new: true }
    );

    // Update last activity
    match.lastMessageAt = new Date();
    const isUser1Sender = String(u1) === String(senderId);
    if (isUser1Sender) {
      match.unreadCount.user2 = (match.unreadCount.user2 || 0) + 1;
    } else {
      match.unreadCount.user1 = (match.unreadCount.user1 || 0) + 1;
    }
    await match.save();

    const message = await Message.create({
      match:     match._id,
      sender:    senderId,
      receiver:  receiverId,
      content:   normalizedContent,
      type,
      delivered: true,
      deliveredAt: new Date(),
    });

    await message.populate('sender', 'firstName lastName name images');
    await message.populate('receiver', 'firstName lastName name images');

    const messagePayload = message.toObject();
    const senderName =
      messagePayload.sender?.name ||
      [messagePayload.sender?.firstName, messagePayload.sender?.lastName].filter(Boolean).join(' ') ||
      'Someone';

    // Emit to receiver's personal room
    io.to(`user:${String(receiverId)}`).emit('message:new', {
      matchId: String(match._id),
      message: messagePayload,
      isDirect: true,
    });

    // Emit a notification to the receiver with view-profile CTA
    io.to(`user:${String(receiverId)}`).emit('notification:new', {
      id:        String(message._id),
      type:      'direct_message',
      matchId:   String(match._id),
      senderId:  String(senderId),
      title:     senderName,
      body:      normalizedContent,
      createdAt: new Date().toISOString(),
      cta:       'view_profile',
    });

    return res.status(201).json({
      success: true,
      message: 'Direct message sent successfully.',
      data: {
        matchId: String(match._id),
        message: messagePayload,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMessages,
  sendMessage,
  deleteMessage,
  sendDirectMessage,
};