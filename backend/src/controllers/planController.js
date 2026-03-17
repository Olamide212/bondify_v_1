const Plan = require('../models/Plan');
const { mapUserImages } = require('../utils/imageHelper');

// ─── Default expiry hours ────────────────────────────────────────────────────
const DEFAULT_EXPIRY_HOURS = 6;

/**
 * Process a populated plan so author + participant images have accessible URLs.
 */
const enrichPlanImages = async (plan) => {
  if (!plan) return plan;
  const p = { ...plan };
  if (p.author) p.author = await mapUserImages(p.author);
  if (Array.isArray(p.participants)) {
    p.participants = await Promise.all(
      p.participants.map(async (pt) => {
        if (pt.user && typeof pt.user === 'object') {
          return { ...pt, user: await mapUserImages(pt.user) };
        }
        return pt;
      })
    );
  }
  return p;
};

// ─────────────────────────────────────────────────────────────────────────────
// GET  /api/plans   — list active plans (newest first, optional nearby filter)
// ─────────────────────────────────────────────────────────────────────────────
const getPlans = async (req, res, next) => {
  try {
    const { page = 1, limit = 30, lng, lat, maxDistance, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = { isActive: true, expiresAt: { $gt: new Date() } };

    // Optional status filter (free | join_me)
    if (status && ['free', 'join_me', 'not_free'].includes(status)) {
      filter.status = status;
    }

    // Optional geo-filter
    if (lng && lat) {
      filter['location.coordinates'] = {
        $nearSphere: {
          $geometry: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
          $maxDistance: Number(maxDistance) || 50000, // 50 km default
        },
      };
    }

    const [plans, total] = await Promise.all([
      Plan.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('author', 'firstName lastName images profilePhoto userName')
        .populate('participants.user', 'firstName lastName images profilePhoto userName')
        .lean(),
      Plan.countDocuments(filter),
    ]);

    // Annotate each plan for the requesting user
    const userId = String(req.user._id);
    const data = await Promise.all(
      plans.map(async (p) => {
        const enriched = await enrichPlanImages(p);
        return {
          ...enriched,
          hasJoined: p.participants.some((pt) => String(pt.user?._id || pt.user) === userId),
          isOwner: String(p.author._id) === userId,
        };
      })
    );

    res.json({
      success: true,
      data,
      pagination: { page: Number(page), limit: Number(limit), total, hasMore: skip + plans.length < total },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST  /api/plans   — create a plan
// ─────────────────────────────────────────────────────────────────────────────
const createPlan = async (req, res, next) => {
  try {
    const { status, note, activity, location, days } = req.body;

    if (!status || !['free', 'join_me', 'not_free'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Must be free, join_me, or not_free.' });
    }

    if (!note || !note.trim()) {
      return res.status(400).json({ success: false, message: 'Note is required.' });
    }

    // Plans expire after 7 days by default
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const plan = await Plan.create({
      author: req.user._id,
      status,
      note: note.trim(),
      activity: activity || '',
      days: Array.isArray(days) ? days : [],
      location: location || undefined,
      expiresAt,
    });

    // Populate for response
    const populated = await Plan.findById(plan._id)
      .populate('author', 'firstName lastName images profilePhoto userName')
      .lean();

    const data = await enrichPlanImages({ ...populated, hasJoined: false, isOwner: true });

    // Emit via socket so other users see the plan in real time
    try {
      const { getIO } = require('../socket');
      getIO().emit('plans:new', data);
    } catch (_) {
      // socket may not be initialized in tests
    }

    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST  /api/plans/:planId/join   — join a plan
// ─────────────────────────────────────────────────────────────────────────────
const joinPlan = async (req, res, next) => {
  try {
    const plan = await Plan.findById(req.params.planId);
    if (!plan || !plan.isActive || plan.expiresAt < new Date()) {
      return res.status(404).json({ success: false, message: 'Plan not found or expired.' });
    }

    const userId = String(req.user._id);
    if (String(plan.author) === userId) {
      return res.status(400).json({ success: false, message: "You can't join your own plan." });
    }

    const alreadyJoined = plan.participants.some((p) => String(p.user) === userId);
    if (alreadyJoined) {
      return res.status(400).json({ success: false, message: 'Already joined this plan.' });
    }

    plan.participants.push({ user: req.user._id });
    await plan.save();

    // Auto-add joiner to existing group chat if one exists
    if (plan.groupChatId) {
      try {
        const PlanChat = require('../models/PlanChat');
        const chat = await PlanChat.findById(plan.groupChatId);
        if (chat && !chat.members.some((m) => String(m) === userId)) {
          chat.members.push(req.user._id);
          await chat.save();
        }
      } catch (_chatErr) {
        // Don't block join if chat update fails
      }
    }

    const populated = await Plan.findById(plan._id)
      .populate('author', 'firstName lastName images profilePhoto userName')
      .populate('participants.user', 'firstName lastName images profilePhoto userName')
      .lean();

    const data = await enrichPlanImages({
      ...populated,
      hasJoined: true,
      isOwner: String(populated.author._id) === userId,
    });

    // Real-time: notify plan author + all participants
    try {
      const { getIO } = require('../socket');
      const io = getIO();
      // Notify plan author
      io.to(`user:${String(populated.author._id)}`).emit('plans:joined', {
        planId: plan._id,
        joinedUser: { _id: req.user._id, firstName: req.user.firstName, lastName: req.user.lastName },
      });
      // Broadcast updated plan
      io.emit('plans:updated', data);
    } catch (_) {}

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST  /api/plans/:planId/leave   — leave a plan
// ─────────────────────────────────────────────────────────────────────────────
const leavePlan = async (req, res, next) => {
  try {
    const plan = await Plan.findById(req.params.planId);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found.' });

    const userId = String(req.user._id);
    plan.participants = plan.participants.filter((p) => String(p.user) !== userId);
    await plan.save();

    const populated = await Plan.findById(plan._id)
      .populate('author', 'firstName lastName images profilePhoto userName')
      .populate('participants.user', 'firstName lastName images profilePhoto userName')
      .lean();

    const data = await enrichPlanImages({
      ...populated,
      hasJoined: false,
      isOwner: String(populated.author._id) === userId,
    });

    try {
      const { getIO } = require('../socket');
      getIO().emit('plans:updated', data);
    } catch (_) {}

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE  /api/plans/:planId   — deactivate (only author)
// ─────────────────────────────────────────────────────────────────────────────
const deletePlan = async (req, res, next) => {
  try {
    const plan = await Plan.findById(req.params.planId);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found.' });

    if (String(plan.author) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    plan.isActive = false;
    await plan.save();

    try {
      const { getIO } = require('../socket');
      getIO().emit('plans:removed', { planId: plan._id });
    } catch (_) {}

    res.json({ success: true, message: 'Plan removed.' });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET  /api/plans/my   — get current user's active plans
// ─────────────────────────────────────────────────────────────────────────────
const getMyPlans = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    const plans = await Plan.find({
      $or: [
        { author: userId },
        { 'participants.user': userId },
      ],
      isActive: true,
      expiresAt: { $gt: now },
    })
      .sort({ createdAt: -1 })
      .populate('author', 'firstName lastName images profilePhoto userName')
      .populate('participants.user', 'firstName lastName images profilePhoto userName')
      .lean();

    const data = await Promise.all(
      plans.map(async (p) => {
        const enriched = await enrichPlanImages(p);
        return {
          ...enriched,
          hasJoined: p.participants.some((pt) => String(pt.user?._id || pt.user) === String(userId)),
          isOwner: String(p.author._id) === String(userId),
        };
      })
    );

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPlans,
  createPlan,
  joinPlan,
  leavePlan,
  deletePlan,
  getMyPlans,
};
