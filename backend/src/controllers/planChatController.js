const Plan = require('../models/Plan');
const PlanChat = require('../models/PlanChat');
const PlanMessage = require('../models/PlanMessage');
const { getIO } = require('../socket');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/plan-chats/:planId/start — Create (or return existing) group chat
// ─────────────────────────────────────────────────────────────────────────────
const startGroupChat = async (req, res, next) => {
  try {
    const { planId } = req.params;
    const userId = req.user._id;

    const plan = await Plan.findById(planId);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found.' });

    // Only the author or a participant can start/access the chat
    const isAuthor = String(plan.author) === String(userId);
    const isParticipant = plan.participants.some(
      (pt) => String(pt.user) === String(userId)
    );
    if (!isAuthor && !isParticipant) {
      return res.status(403).json({ success: false, message: 'You must be part of this plan.' });
    }

    // Check if chat already exists
    let chat = await PlanChat.findOne({ plan: planId });

    if (!chat) {
      // Build members list: author + all current participants
      const memberIds = [
        plan.author,
        ...plan.participants.map((pt) => pt.user),
      ];
      // Deduplicate
      const uniqueMembers = [...new Set(memberIds.map(String))];

      chat = await PlanChat.create({
        plan: planId,
        members: uniqueMembers,
      });

      // Store groupChatId on the plan
      plan.groupChatId = String(chat._id);
      await plan.save();

      // Notify via socket
      const io = getIO();
      if (io) {
        io.emit('plans:updated', {
          ...plan.toObject(),
          groupChatId: String(chat._id),
        });
      }
    }

    // Populate members
    const populated = await PlanChat.findById(chat._id)
      .populate('members', 'firstName lastName images profilePhoto userName')
      .lean();

    res.json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/plan-chats/:chatId/messages — Get messages for a plan group chat
// ─────────────────────────────────────────────────────────────────────────────
const getMessages = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const chat = await PlanChat.findById(chatId);
    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found.' });

    // Must be a member
    if (!chat.members.some((m) => String(m) === String(req.user._id))) {
      return res.status(403).json({ success: false, message: 'Not a member of this chat.' });
    }

    const [messages, total] = await Promise.all([
      PlanMessage.find({ planChat: chatId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('sender', 'firstName lastName images profilePhoto userName')
        .lean(),
      PlanMessage.countDocuments({ planChat: chatId }),
    ]);

    res.json({
      success: true,
      data: messages.reverse(), // oldest first for chat UI
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
// POST /api/plan-chats/:chatId/messages — Send a message
// ─────────────────────────────────────────────────────────────────────────────
const sendMessage = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const { content, type = 'text', mediaUrl } = req.body;

    if (!content && !mediaUrl) {
      return res.status(400).json({ success: false, message: 'Content or media required.' });
    }

    const chat = await PlanChat.findById(chatId);
    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found.' });

    if (!chat.members.some((m) => String(m) === String(req.user._id))) {
      return res.status(403).json({ success: false, message: 'Not a member of this chat.' });
    }

    const message = await PlanMessage.create({
      planChat: chatId,
      sender: req.user._id,
      content: content || '',
      type,
      mediaUrl: mediaUrl || undefined,
    });

    // Update last message on the chat
    chat.lastMessageAt = message.createdAt;
    chat.lastMessage = {
      content: content || (type === 'image' ? 'Sent a photo' : 'Sent media'),
      sender: req.user._id,
    };
    await chat.save();

    // Populate sender for the response
    const populated = await PlanMessage.findById(message._id)
      .populate('sender', 'firstName lastName images profilePhoto userName')
      .lean();

    // Emit to all members via socket
    const io = getIO();
    if (io) {
      io.emit(`planChat:${chatId}:message`, populated);
    }

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/plan-chats/:chatId — Get chat details
// ─────────────────────────────────────────────────────────────────────────────
const getChatDetails = async (req, res, next) => {
  try {
    const { chatId } = req.params;

    const chat = await PlanChat.findById(chatId)
      .populate('members', 'firstName lastName images profilePhoto userName')
      .populate('plan', 'status note activity expiresAt author')
      .lean();

    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found.' });

    if (!chat.members.some((m) => String(m._id) === String(req.user._id))) {
      return res.status(403).json({ success: false, message: 'Not a member of this chat.' });
    }

    res.json({ success: true, data: chat });
  } catch (err) {
    next(err);
  }
};

module.exports = { startGroupChat, getMessages, sendMessage, getChatDetails };
