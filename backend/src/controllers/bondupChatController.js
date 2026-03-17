const Bondup = require('../models/Bondup');
const BondupChat = require('../models/BondupChat');
const BondupMessage = require('../models/BondupMessage');
const { getIO } = require('../socket');
const { mapUserImages } = require('../utils/imageHelper');

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

    if (!content && !mediaUrl) {
      return res.status(400).json({ success: false, message: 'Content or media required.' });
    }

    const chat = await BondupChat.findById(chatId);
    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found.' });

    if (!chat.members.some((m) => String(m) === String(req.user._id))) {
      return res.status(403).json({ success: false, message: 'Not a member of this chat.' });
    }

    const message = await BondupMessage.create({
      bondupChat: chatId,
      sender: req.user._id,
      content: content || '',
      type,
      mediaUrl: mediaUrl || undefined,
    });

    chat.lastMessageAt = message.createdAt;
    chat.lastMessage = {
      content: content || (type === 'image' ? 'Sent a photo' : 'Sent media'),
      sender: req.user._id,
    };
    await chat.save();

    const populated = await BondupMessage.findById(message._id)
      .populate('sender', 'firstName lastName images profilePhoto userName')
      .lean();

    if (populated.sender && typeof populated.sender === 'object') {
      populated.sender = await mapUserImages(populated.sender);
    }

    const io = getIO();
    if (io) {
      io.emit(`bondupChat:${chatId}:message`, populated);
    }

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  startBondupChat,
  getBondupChatDetails,
  getBondupMessages,
  sendBondupMessage,
};
