const Bondup = require('../models/Bondup');
const BondupChat = require('../models/BondupChat');
const BondupMessage = require('../models/BondupMessage');
const { getIO } = require('../socket');
const { mapUserImages } = require('../utils/imageHelper');

const MESSAGE_LIMIT = BondupChat.MESSAGE_LIMIT; // 3

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/bondup-chats/:bondupId/start — Create (or return existing) chat
// ─────────────────────────────────────────────────────────────────────────────
const startBondupChat = async (req, res, next) => {
  try {
    const { bondupId } = req.params;
    const userId = req.user._id;

    const bondup = await Bondup.findById(bondupId);
    if (!bondup || !bondup.isActive) {
      return res.status(404).json({ success: false, message: 'Bondup not found.' });
    }

    // Only creator or participants can start/access the chat
    const isCreator = String(bondup.createdBy) === String(userId);
    const isParticipant = bondup.participants.some(
      (pt) => String(pt.user) === String(userId)
    );
    if (!isCreator && !isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You must be part of this Bondup to access the chat.',
      });
    }

    // Return existing chat if it exists
    let chat = await BondupChat.findOne({ bondup: bondupId });

    if (!chat) {
      const memberIds = [
        bondup.createdBy,
        ...bondup.participants.map((pt) => pt.user),
      ];
      const uniqueMembers = [...new Set(memberIds.map(String))];
      const chatType = uniqueMembers.length > 2 ? 'bondup_group' : 'bondup_single';

      chat = await BondupChat.create({
        bondup: bondupId,
        type: chatType,
        members: uniqueMembers,
        expiresAt: new Date(bondup.dateTime.getTime() + 24 * 60 * 60 * 1000),
      });

      // Link chat back to bondup
      bondup.chatId = chat._id;
      await bondup.save();
    }

    const populated = await BondupChat.findById(chat._id)
      .populate('members', 'firstName lastName images profilePhoto userName')
      .lean();

    if (populated.members) {
      populated.members = await Promise.all(populated.members.map(mapUserImages));
    }

    res.json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/bondup-chats/:chatId — Get chat details
// ─────────────────────────────────────────────────────────────────────────────
const getBondupChatDetails = async (req, res, next) => {
  try {
    const { chatId } = req.params;

    const chat = await BondupChat.findById(chatId)
      .populate('members', 'firstName lastName images profilePhoto userName')
      .populate('bondup', 'title activityType dateTime expiresAt createdBy')
      .lean();

    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found.' });

    if (!chat.members.some((m) => String(m._id) === String(req.user._id))) {
      return res.status(403).json({ success: false, message: 'Not a member of this chat.' });
    }

    if (chat.members) {
      chat.members = await Promise.all(chat.members.map(mapUserImages));
    }

    res.json({ success: true, data: chat });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/bondup-chats/:chatId/messages
// ─────────────────────────────────────────────────────────────────────────────
const getBondupMessages = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const chat = await BondupChat.findById(chatId);
    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found.' });

    if (!chat.members.some((m) => String(m) === String(req.user._id))) {
      return res.status(403).json({ success: false, message: 'Not a member of this chat.' });
    }

    const [messages, total] = await Promise.all([
      BondupMessage.find({ bondupChat: chatId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('sender', 'firstName lastName images profilePhoto userName')
        .lean(),
      BondupMessage.countDocuments({ bondupChat: chatId }),
    ]);

    const enrichedMessages = await Promise.all(
      messages.map(async (msg) => {
        if (msg.sender && typeof msg.sender === 'object') {
          return { ...msg, sender: await mapUserImages(msg.sender) };
        }
        return msg;
      })
    );

    res.json({
      success: true,
      data: enrichedMessages.reverse(), // oldest first
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        hasMore: skip + messages.length < total,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/bondup-chats/:chatId/messages — Send a message
// ─────────────────────────────────────────────────────────────────────────────
const sendBondupMessage = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const { content, type = 'text', mediaUrl } = req.body;
    const userId = req.user._id;

    if (!content && !mediaUrl) {
      return res.status(400).json({ success: false, message: 'Content or media required.' });
    }

    const chat = await BondupChat.findById(chatId);
    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found.' });

    if (!chat.members.some((m) => String(m) === String(userId))) {
      return res.status(403).json({ success: false, message: 'Not a member of this chat.' });
    }

    // Message limits removed — bondup chats are free to use

    const message = await BondupMessage.create({
      bondupChat: chatId,
      sender: userId,
      content: content || '',
      type,
      mediaUrl: mediaUrl || undefined,
    });

    // Update chat metadata
    chat.lastMessageAt = message.createdAt;
    chat.lastMessage = {
      content: content || (type === 'image' ? 'Sent a photo' : 'Sent media'),
      sender: userId,
    };

    // Message count tracking (informational only — no limit enforcement)
    if (chat.type === 'bondup_single') {
      const userKey = String(userId);
      const prev = chat.messageCountPerUser?.get(userKey) || 0;
      chat.messageCountPerUser.set(userKey, prev + 1);
    }

    await chat.save();

    const populated = await BondupMessage.findById(message._id)
      .populate('sender', 'firstName lastName images profilePhoto userName')
      .lean();

    if (populated.sender && typeof populated.sender === 'object') {
      populated.sender = await mapUserImages(populated.sender);
    }

    const io = getIO();
    if (io) {
      // Emit to the chat room for all members who have joined
      // Note: Room-based emission ensures all connected members receive the message
      // The sender will also receive it and should filter on the client side
      io.to(`bondupChat:${chatId}`).emit(`bondupChat:${chatId}:message`, populated);
    }

    res.status(201).json({
      success: true,
      data: populated,
      meta: chat.type === 'bondup_single' ? {
        messagesRemaining: Infinity,
        matchStatus: chat.matchStatus || 'none',
      } : undefined,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/bondup-chats/:chatId/state — Get chat state (match status, limits)
// ─────────────────────────────────────────────────────────────────────────────
const getBondupChatState = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;

    const chat = await BondupChat.findById(chatId)
      .populate('matchInitiatedBy', 'firstName lastName')
      .lean();

    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found.' });
    if (!chat.members.some((m) => String(m) === String(userId))) {
      return res.status(403).json({ success: false, message: 'Not a member of this chat.' });
    }

    const userKey = String(userId);
    const messageCount = chat.messageCountPerUser?.[userKey] || 0;

    res.json({
      success: true,
      data: {
        chatId: chat._id,
        type: chat.type,
        matchStatus: chat.matchStatus || 'none',
        matchInitiatedBy: chat.matchInitiatedBy,
        messageLimit: Infinity,
        messagesSent: messageCount,
        messagesRemaining: Infinity,
        isLimitReached: false,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/bondup-chats/:chatId/match — Request or accept a match
// ─────────────────────────────────────────────────────────────────────────────
const requestMatch = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;

    const chat = await BondupChat.findById(chatId);
    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found.' });

    if (chat.type !== 'bondup_single') {
      return res.status(400).json({ success: false, message: 'Match is only for 1-on-1 chats.' });
    }

    if (!chat.members.some((m) => String(m) === String(userId))) {
      return res.status(403).json({ success: false, message: 'Not a member of this chat.' });
    }

    const io = getIO();

    if (chat.matchStatus === 'matched') {
      return res.json({ success: true, message: 'Already matched!', data: { matchStatus: 'matched' } });
    }

    if (chat.matchStatus === 'none') {
      // First user requests match → move to pending
      chat.matchStatus = 'pending';
      chat.matchInitiatedBy = userId;
      await chat.save();

      // Notify the other member
      const otherMember = chat.members.find((m) => String(m) !== String(userId));
      if (io && otherMember) {
        io.to(`user:${String(otherMember)}`).emit('bondupChat:matchRequested', {
          chatId: chat._id,
          matchInitiatedBy: userId,
        });
      }

      // Also broadcast to chat room
      if (io) {
        io.to(`bondupChat:${chatId}`).emit(`bondupChat:${chatId}:matchUpdate`, {
          chatId: chat._id,
          matchStatus: 'pending',
          matchInitiatedBy: userId,
        });
      }

      return res.json({
        success: true,
        message: 'Match request sent!',
        data: { matchStatus: 'pending', matchInitiatedBy: userId },
      });
    }

    if (chat.matchStatus === 'pending') {
      // Check if the current user is the one who initiated (can't accept own request)
      if (String(chat.matchInitiatedBy) === String(userId)) {
        return res.status(400).json({
          success: false,
          message: 'Waiting for the other person to accept your match request.',
        });
      }

      // The other user is accepting → MATCHED!
      chat.matchStatus = 'matched';
      await chat.save();

      // Notify both members
      chat.members.forEach((memberId) => {
        if (io) {
          io.to(`user:${String(memberId)}`).emit('bondupChat:matched', {
            chatId: chat._id,
          });
        }
      });

      // Broadcast to chat room
      if (io) {
        io.to(`bondupChat:${chatId}`).emit(`bondupChat:${chatId}:matchUpdate`, {
          chatId: chat._id,
          matchStatus: 'matched',
        });
      }

      return res.json({
        success: true,
        message: "It's a match! You can now chat freely.",
        data: { matchStatus: 'matched' },
      });
    }

    res.status(400).json({ success: false, message: 'Unexpected match state.' });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/bondup-chats/:chatId/unmatch — Decline / withdraw match
// ─────────────────────────────────────────────────────────────────────────────
const declineMatch = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;

    const chat = await BondupChat.findById(chatId);
    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found.' });

    if (chat.type !== 'bondup_single') {
      return res.status(400).json({ success: false, message: 'Match is only for 1-on-1 chats.' });
    }

    if (!chat.members.some((m) => String(m) === String(userId))) {
      return res.status(403).json({ success: false, message: 'Not a member of this chat.' });
    }

    if (chat.matchStatus === 'none') {
      return res.json({ success: true, message: 'No pending match to decline.', data: { matchStatus: 'none' } });
    }

    // Reset to none
    chat.matchStatus = 'none';
    chat.matchInitiatedBy = null;
    await chat.save();

    const io = getIO();
    if (io) {
      io.to(`bondupChat:${chatId}`).emit(`bondupChat:${chatId}:matchUpdate`, {
        chatId: chat._id,
        matchStatus: 'none',
      });
    }

    res.json({
      success: true,
      message: 'Match declined.',
      data: { matchStatus: 'none' },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/bondup-chats/:chatId/user-profile/:userId — Get bondup user profile
// ─────────────────────────────────────────────────────────────────────────────
const getBondupUserProfile = async (req, res, next) => {
  try {
    const { chatId, userId: targetUserId } = req.params;
    const requesterId = req.user._id;

    // Verify requester is a member of this chat
    const chat = await BondupChat.findById(chatId);
    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found.' });
    if (!chat.members.some((m) => String(m) === String(requesterId))) {
      return res.status(403).json({ success: false, message: 'Not a member of this chat.' });
    }

    const User = require('mongoose').model('User');
    const targetUser = await User.findById(targetUserId)
      .select('firstName lastName images profilePhoto userName city')
      .lean();

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const enrichedUser = await mapUserImages(targetUser);

    // Get user's active bondups count + recent bondups
    const now = new Date();
    const activeBondups = await Bondup.find({
      $or: [
        { createdBy: targetUserId },
        { 'participants.user': targetUserId },
      ],
      isActive: true,
      expiresAt: { $gt: now },
    })
      .sort({ dateTime: 1 })
      .limit(10)
      .populate('createdBy', 'firstName lastName images profilePhoto')
      .lean();

    // Get follow stats (from social profile if available)
    let followStats = { followersCount: 0, followingCount: 0 };
    try {
      const SocialProfile = require('mongoose').model('SocialProfile');
      const socialProfile = await SocialProfile.findOne({ user: targetUserId }).lean();
      if (socialProfile) {
        followStats = {
          followersCount: socialProfile.followersCount || socialProfile.followers?.length || 0,
          followingCount: socialProfile.followingCount || socialProfile.following?.length || 0,
          bio: socialProfile.bio || '',
        };
      }
    } catch {
      // SocialProfile model may not exist — ignore
    }

    res.json({
      success: true,
      data: {
        user: enrichedUser,
        stats: {
          ...followStats,
          bondups: activeBondups.length,
        },
        activeBondups: activeBondups.map((b) => ({
          _id: b._id,
          title: b.title,
          activityType: b.activityType,
          city: b.city,
          dateTime: b.dateTime,
          participantCount: b.participants?.length || 0,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  startBondupChat,
  getBondupChatDetails,
  getBondupMessages,
  sendBondupMessage,
  getBondupChatState,
  requestMatch,
  declineMatch,
  getBondupUserProfile,
};
