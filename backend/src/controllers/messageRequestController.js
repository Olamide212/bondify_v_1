const MessageRequest = require('../models/MessageRequest');
const Match = require('../models/Match');
const User = require('../models/User');
const BlockedUser = require('../models/BlockedUser');
const { getIO } = require('../socket');
const { sendPushToUser } = require('../utils/pushDispatchService');

// ── Constants ────────────────────────────────────────────────────────────────
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
const MAX_DAILY_REQUESTS = 5; // Rate limit per user per day

// ── Helpers ──────────────────────────────────────────────────────────────────

const emitNotification = (userId, payload) => {
  try {
    const io = getIO();
    io.to(`user:${String(userId)}`).emit('notification:new', payload);
  } catch {
    // Socket may not be initialized
  }
};

const emitMessageRequestUpdate = (userId, payload) => {
  try {
    const io = getIO();
    io.to(`user:${String(userId)}`).emit('message_request:update', payload);
  } catch {
    // Socket may not be initialized
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  CREATE MESSAGE REQUEST
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Send a message request (compliment/photo comment) to another user
 * @route   POST /api/message-requests
 * @access  Private
 */
const createMessageRequest = async (req, res, next) => {
  try {
    const fromUserId = req.user._id;
    const { 
      targetUserId, 
      content, 
      type = 'compliment', 
      imageIndex = 0, 
      imageUrl = null 
    } = req.body;

    // ── Validation ────────────────────────────────────────────
    if (!targetUserId || !content?.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'targetUserId and content are required.' 
      });
    }

    if (String(fromUserId) === String(targetUserId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'You cannot send a request to yourself.' 
      });
    }

    // Check if target user exists
    const targetUser = await User.findById(targetUserId).select('firstName images privacySettings');
    if (!targetUser) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found.' 
      });
    }

    // Check if target user allows message requests from non-matches
    if (!targetUser.privacySettings?.allowMessageFromNonMatches) {
      return res.status(403).json({ 
        success: false, 
        message: 'This user does not accept messages from non-matches.',
        code: 'REQUESTS_NOT_ALLOWED'
      });
    }

    // Check if blocked
    const blocked = await BlockedUser.findOne({
      $or: [
        { blocker: fromUserId, blocked: targetUserId },
        { blocker: targetUserId, blocked: fromUserId },
      ],
    });
    if (blocked) {
      return res.status(403).json({ 
        success: false, 
        message: 'Cannot send request to this user.' 
      });
    }

    // Check if already matched
    const existingMatch = await Match.findOne({
      $or: [
        { user1: fromUserId, user2: targetUserId, status: 'matched' },
        { user1: targetUserId, user2: fromUserId, status: 'matched' },
      ],
    });
    if (existingMatch) {
      return res.status(400).json({ 
        success: false, 
        message: 'You are already matched with this user. Send a direct message instead.',
        code: 'ALREADY_MATCHED'
      });
    }

    // Check for existing pending request
    const existingRequest = await MessageRequest.findOne({
      fromUser: fromUserId,
      toUser: targetUserId,
      status: 'pending',
    });
    if (existingRequest) {
      return res.status(400).json({ 
        success: false, 
        message: 'You already have a pending request to this user.',
        code: 'DUPLICATE_REQUEST'
      });
    }

    // Rate limit: max requests per day
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const dailyCount = await MessageRequest.countDocuments({
      fromUser: fromUserId,
      createdAt: { $gte: startOfDay },
    });
    if (dailyCount >= MAX_DAILY_REQUESTS) {
      return res.status(429).json({
        success: false,
        message: `You've reached your daily limit of ${MAX_DAILY_REQUESTS} requests. Try again tomorrow.`,
        code: 'RATE_LIMIT_EXCEEDED'
      });
    }

    // ── Create the request ────────────────────────────────────
    const expiresAt = new Date(Date.now() + THREE_DAYS_MS);
    
    const request = await MessageRequest.create({
      fromUser: fromUserId,
      toUser: targetUserId,
      type,
      content: content.trim(),
      imageIndex: type === 'photo_comment' ? Number(imageIndex) || 0 : 0,
      imageUrl: type === 'photo_comment' ? imageUrl : null,
      expiresAt,
    });

    // Populate sender info
    const populated = await request.populate('fromUser', 'firstName lastName images');

    // ── Real-time notification ────────────────────────────────
    const notificationPayload = {
      type: 'message_request',
      requestId: request._id,
      requestType: type,
      fromUser: {
        id: populated.fromUser._id,
        name: populated.fromUser.firstName,
        image: populated.fromUser.images?.[0]?.url || null,
      },
      content: content.trim().substring(0, 50) + (content.length > 50 ? '...' : ''),
      imageUrl: type === 'photo_comment' ? imageUrl : null,
      expiresAt,
      createdAt: request.createdAt,
    };

    emitNotification(targetUserId, notificationPayload);
    emitMessageRequestUpdate(targetUserId, { action: 'new', request: notificationPayload });

    // Push notification
    const pushTitle = type === 'photo_comment' 
      ? `${populated.fromUser.firstName || 'Someone'} commented on your photo`
      : `${populated.fromUser.firstName || 'Someone'} sent you a compliment`;

    sendPushToUser({
      userId: targetUserId,
      title: pushTitle,
      body: content.trim().substring(0, 100),
      data: {
        type: 'message_request',
        requestId: String(request._id),
        senderId: String(fromUserId),
      },
      settingKey: 'newLike',
      onlyWhenOffline: true,
    }).catch((err) => {
      console.error('[expo-push] message request push error:', err?.message || err);
    });

    res.status(201).json({
      success: true,
      message: 'Request sent successfully',
      data: {
        request: {
          id: request._id,
          type: request.type,
          content: request.content,
          expiresAt: request.expiresAt,
          status: request.status,
        },
      },
    });
  } catch (error) {
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending request to this user.',
        code: 'DUPLICATE_REQUEST'
      });
    }
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  GET RECEIVED REQUESTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Get all pending message requests received by current user
 * @route   GET /api/message-requests/received
 * @access  Private
 */
const getReceivedRequests = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { status = 'pending', page = 1, limit = 20 } = req.query;

    const query = { toUser: userId };
    if (status !== 'all') {
      query.status = status;
    }

    const requests = await MessageRequest.find(query)
      .populate({
        path: 'fromUser',
        select: 'firstName lastName images age occupation location isVerified isDeleted isActive',
        match: { isDeleted: { $ne: true }, isActive: true },
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    const total = await MessageRequest.countDocuments(query);

    // Add time remaining to each request
    const now = new Date();
    const requestsWithMeta = requests
      .filter((r) => r.fromUser)
      .map(r => ({
      ...r,
      timeRemaining: r.status === 'pending' ? Math.max(0, r.expiresAt.getTime() - now.getTime()) : 0,
      isExpired: r.status === 'pending' && now > r.expiresAt,
    }));

    res.json({
      success: true,
      data: {
        requests: requestsWithMeta,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  GET SENT REQUESTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Get all message requests sent by current user
 * @route   GET /api/message-requests/sent
 * @access  Private
 */
const getSentRequests = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { status = 'all', page = 1, limit = 20 } = req.query;

    const query = { fromUser: userId };
    if (status !== 'all') {
      query.status = status;
    }

    const requests = await MessageRequest.find(query)
      .populate({
        path: 'toUser',
        select: 'firstName lastName images isDeleted isActive',
        match: { isDeleted: { $ne: true }, isActive: true },
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    const total = await MessageRequest.countDocuments(query);

    const visibleRequests = requests.filter((r) => r.toUser);

    res.json({
      success: true,
      data: {
        requests: visibleRequests,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  ACCEPT REQUEST
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Accept a message request (creates a match)
 * @route   PATCH /api/message-requests/:id/accept
 * @access  Private
 */
const acceptRequest = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const request = await MessageRequest.findById(id)
      .populate({
        path: 'fromUser',
        select: 'firstName lastName images isDeleted isActive',
        match: { isDeleted: { $ne: true }, isActive: true },
      });

    if (!request) {
      return res.status(404).json({ 
        success: false, 
        message: 'Request not found.' 
      });
    }

    if (!request.fromUser) {
      request.status = 'declined';
      request.respondedAt = new Date();
      await request.save();
      return res.status(404).json({
        success: false,
        message: 'Request sender is no longer available.',
      });
    }

    // Verify ownership
    if (String(request.toUser) !== String(userId)) {
      return res.status(403).json({ 
        success: false, 
        message: 'You cannot accept this request.' 
      });
    }

    // Check if already responded
    if (request.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: `Request has already been ${request.status}.` 
      });
    }

    // Check if expired
    if (new Date() > request.expiresAt) {
      request.status = 'declined';
      await request.save();
      return res.status(400).json({ 
        success: false, 
        message: 'This request has expired.',
        code: 'REQUEST_EXPIRED'
      });
    }

    // ── Create match ─────────────────────────────────────────
    const now = new Date();
    
    // Check for existing match
    let match = await Match.findOne({
      $or: [
        { user1: userId, user2: request.fromUser._id },
        { user1: request.fromUser._id, user2: userId },
      ],
    });

    if (match) {
      // Update existing match to 'matched' status
      match.status = 'matched';
      match.matchedAt = now;
      match.lastMessageAt = now;
      await match.save();
    } else {
      // Create new match
      match = await Match.create({
        user1: request.fromUser._id,
        user2: userId,
        status: 'matched',
        initiatedBy: request.fromUser._id,
        matchedAt: now,
        lastMessageAt: now,
        unreadCount: { user1: 0, user2: 0 },
      });
    }

    // Update request
    request.status = 'accepted';
    request.respondedAt = now;
    request.match = match._id;
    await request.save();

    // ── Notify the sender ─────────────────────────────────────
    const currentUser = await User.findById(userId).select('firstName images');
    
    const matchNotification = {
      type: 'request_accepted',
      requestId: request._id,
      matchId: match._id,
      fromUser: {
        id: userId,
        name: currentUser.firstName,
        image: currentUser.images?.[0]?.url || null,
      },
    };

    emitNotification(String(request.fromUser._id), matchNotification);
    emitNotification(String(userId), { type: 'new_match', matchId: match._id, userId: request.fromUser._id });

    // Push notification to sender
    sendPushToUser({
      userId: request.fromUser._id,
      title: "It's a match! 🎉",
      body: `${currentUser.firstName || 'Someone'} accepted your request!`,
      data: {
        type: 'new_match',
        matchId: String(match._id),
        userId: String(userId),
      },
      settingKey: 'newMatch',
      onlyWhenOffline: true,
    }).catch((err) => {
      console.error('[expo-push] match notification error:', err?.message || err);
    });

    res.json({
      success: true,
      message: 'Request accepted! You are now matched.',
      data: {
        matchId: match._id,
        matchedUser: {
          id: request.fromUser._id,
          name: request.fromUser.firstName,
          image: request.fromUser.images?.[0]?.url || null,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  DECLINE REQUEST
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Decline a message request
 * @route   PATCH /api/message-requests/:id/decline
 * @access  Private
 */
const declineRequest = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const request = await MessageRequest.findById(id);

    if (!request) {
      return res.status(404).json({ 
        success: false, 
        message: 'Request not found.' 
      });
    }

    // Verify ownership
    if (String(request.toUser) !== String(userId)) {
      return res.status(403).json({ 
        success: false, 
        message: 'You cannot decline this request.' 
      });
    }

    // Check if already responded
    if (request.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: `Request has already been ${request.status}.` 
      });
    }

    // Update request
    request.status = 'declined';
    request.respondedAt = new Date();
    await request.save();

    // Emit update
    emitMessageRequestUpdate(String(request.fromUser), { 
      action: 'declined', 
      requestId: request._id 
    });

    res.json({
      success: true,
      message: 'Request declined.',
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  GET PENDING COUNT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Get count of pending (unread) message requests
 * @route   GET /api/message-requests/count
 * @access  Private
 */
const getPendingCount = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const count = await MessageRequest.countDocuments({
      toUser: userId,
      status: 'pending',
      read: false,
    });

    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  MARK AS READ
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Mark message requests as read
 * @route   PATCH /api/message-requests/mark-read
 * @access  Private
 */
const markAsRead = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { requestIds } = req.body;

    if (requestIds && Array.isArray(requestIds) && requestIds.length > 0) {
      // Mark specific requests as read
      await MessageRequest.updateMany(
        { _id: { $in: requestIds }, toUser: userId },
        { $set: { read: true } }
      );
    } else {
      // Mark all as read
      await MessageRequest.updateMany(
        { toUser: userId, read: false },
        { $set: { read: true } }
      );
    }

    res.json({
      success: true,
      message: 'Requests marked as read.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createMessageRequest,
  getReceivedRequests,
  getSentRequests,
  acceptRequest,
  declineRequest,
  getPendingCount,
  markAsRead,
};
