/**
 * mapController.js
 *
 * Endpoints:
 *   GET  /api/map/nearby              — nearby users with optional filters
 *   GET  /api/map/status              — my current active status
 *   POST /api/map/status              — create / replace status (text + optional image)
 *   DELETE /api/map/status            — delete my status
 *   POST /api/map/status/:id/react    — react to someone's status
 *   POST /api/map/status/ai-suggest   — AI-generated text suggestions
 *   POST /api/map/location            — update my location
 */

const User       = require('../models/User');
const UserStatus = require('../models/UserStatus');
const BlockedUser = require('../models/BlockedUser');

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────

/**
 * Very lightweight nudity heuristic using the Anthropic API.
 * Returns { flagged: boolean, score: number }
 *
 * In production replace with a dedicated vision-safety API
 * (e.g. AWS Rekognition, Google SafeSearch, Sightengine).
 */
const checkImageForNudity = async (imageUrl) => {
  try {
    const Anthropic = require('@anthropic-ai/sdk');
    const client    = new Anthropic.Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model:      'claude-opus-4-6',
      max_tokens: 60,
      messages: [
        {
          role: 'user',
          content: [
            {
              type:   'image',
              source: { type: 'url', url: imageUrl },
            },
            {
              type: 'text',
              text: 'Does this image contain nudity, explicit sexual content, or graphic material? Reply with only valid JSON: {"flagged": true|false, "score": 0.0-1.0}',
            },
          ],
        },
      ],
    });

    const raw    = response.content[0]?.text?.trim() ?? '{}';
    const parsed = JSON.parse(raw.replace(/```json|```/g, ''));
    return { flagged: !!parsed.flagged, score: parsed.score ?? 0 };
  } catch (err) {
    console.error('Nudity check failed:', err.message);
    // Fail-open: don't block the post, but log it
    return { flagged: false, score: 0 };
  }
};

// ─────────────────────────────────────────────
//  UPDATE MY LOCATION
// ─────────────────────────────────────────────
const updateLocation = async (req, res, next) => {
  try {
    const { latitude, longitude, city, state, country } = req.body;

    if (latitude == null || longitude == null) {
      return res.status(400).json({ success: false, message: 'latitude and longitude are required' });
    }

    await User.findByIdAndUpdate(req.user._id, {
      location: {
        type:        'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
        city,
        state,
        country,
      },
      lastActiveAt: new Date(),
    });

    res.json({ success: true, message: 'Location updated' });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
//  NEARBY USERS
// ─────────────────────────────────────────────
const getNearbyUsers = async (req, res, next) => {
  try {
    const {
      latitude,
      longitude,
      radiusKm   = 50,    // default 50 km
      religion,           // filter: "christian" | "muslim" | etc.
      lookingFor,         // filter: "long-term" | "casual" | etc.
      gender,
      minAge,
      maxAge,
      limit = 50,
    } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'latitude and longitude are required' });
    }

    const lng = parseFloat(longitude);
    const lat = parseFloat(latitude);
    const maxDistanceMeters = parseFloat(radiusKm) * 1000;

    // ── Build filter ──────────────────────────────────────────
    const filter = {
      _id:       { $ne: req.user._id },
      isDeleted: { $ne: true },
      isActive:  true,
      location: {
        $near: {
          $geometry:    { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: maxDistanceMeters,
        },
      },
    };

    if (religion)   filter.religion   = new RegExp(religion, 'i');
    if (lookingFor) filter.lookingFor = new RegExp(lookingFor, 'i');
    if (gender)     filter.gender     = new RegExp(gender, 'i');

    if (minAge || maxAge) {
      const now = new Date();
      filter.age = {};
      if (minAge) filter.age.$lte = parseInt(minAge); // older birthdate = lower age
      if (maxAge) filter.age.$gte = parseInt(maxAge);
    }

    // ── Exclude blocked users ─────────────────────────────────
    const [blockedByMe, blockedMe] = await Promise.all([
      BlockedUser.find({ blocker: req.user._id }).distinct('blocked'),
      BlockedUser.find({ blocked: req.user._id }).distinct('blocker'),
    ]);
    const excluded = [...new Set([...blockedByMe.map(String), ...blockedMe.map(String)])];
    if (excluded.length) filter._id.$nin = excluded;

    // ── Query users ───────────────────────────────────────────
    const users = await User.find(filter)
      .select(
        'firstName age gender images location religion lookingFor ' +
        'verificationStatus completionPercentage privacySettings lastActiveAt'
      )
      .limit(parseInt(limit));

    // ── Attach active status to each user ─────────────────────
    const userIds  = users.map((u) => u._id);
    const statuses = await UserStatus.find({
      user:      { $in: userIds },
      isVisible: true,
      expiresAt: { $gt: new Date() },
    }).select('user text imageUrl expiresAt reactions');

    const statusMap = {};
    statuses.forEach((s) => { statusMap[s.user.toString()] = s; });

    const result = users
      .filter((u) => {
        // Respect user's privacy — skip if they've hidden their location
        return u.privacySettings?.showDistance !== false;
      })
      .map((u) => ({
        _id:          u._id,
        firstName:    u.firstName,
        age:          u.age,
        gender:       u.gender,
        profilePhoto: u.images?.[0]?.url || u.images?.[0] || null,
        coordinates:  u.location?.coordinates, // [lng, lat]
        city:         u.location?.city,
        religion:     u.religion,
        lookingFor:   u.lookingFor,
        verified:     u.verificationStatus === 'verified',
        lastActiveAt: u.lastActiveAt,
        status:       statusMap[u._id.toString()] ?? null,
      }));

    res.json({ success: true, data: result, total: result.length });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
//  GET MY STATUS
// ─────────────────────────────────────────────
const getMyStatus = async (req, res, next) => {
  try {
    const status = await UserStatus.findOne({
      user:      req.user._id,
      isVisible: true,
      expiresAt: { $gt: new Date() },
    });

    res.json({ success: true, data: status || null });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
//  CREATE / REPLACE STATUS
// ─────────────────────────────────────────────
const createStatus = async (req, res, next) => {
  try {
    const { text, imageUrl, imagePublicId, latitude, longitude } = req.body;

    if (!text && !imageUrl) {
      return res.status(400).json({ success: false, message: 'Status must have text or an image' });
    }

    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'Location is required for a status' });
    }

    if (text && text.length > 280) {
      return res.status(400).json({ success: false, message: 'Status text cannot exceed 280 characters' });
    }

    // ── Nudity check for images ───────────────────────────────
    let nudityFlagged  = false;
    let moderationScore = 0;

    if (imageUrl) {
      const check     = await checkImageForNudity(imageUrl);
      nudityFlagged   = check.flagged;
      moderationScore = check.score;

      if (nudityFlagged) {
        return res.status(400).json({
          success: false,
          message:
            'Your image was flagged for inappropriate content and cannot be posted. ' +
            'Please use a different photo.',
        });
      }
    }

    // ── Delete any existing active status ─────────────────────
    await UserStatus.deleteMany({ user: req.user._id });

    const status = await UserStatus.create({
      user:     req.user._id,
      text:     text?.trim(),
      imageUrl,
      imagePublicId,
      nudityFlagged,
      moderationScore,
      isVisible: true,
      location:  {
        type:        'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      },
    });

    res.status(201).json({ success: true, data: status });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
//  DELETE MY STATUS
// ─────────────────────────────────────────────
const deleteStatus = async (req, res, next) => {
  try {
    await UserStatus.deleteMany({ user: req.user._id });
    res.json({ success: true, message: 'Status deleted' });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
//  REACT TO A STATUS
// ─────────────────────────────────────────────
const reactToStatus = async (req, res, next) => {
  try {
    const { id }       = req.params;
    const { reaction } = req.body; // 'heart' | 'fire' | 'laugh' | null (to remove)

    const ALLOWED = ['heart', 'fire', 'laugh', 'wave'];
    if (reaction && !ALLOWED.includes(reaction)) {
      return res.status(400).json({ success: false, message: `Reaction must be one of: ${ALLOWED.join(', ')}` });
    }

    const status = await UserStatus.findOne({ _id: id, isVisible: true });
    if (!status) return res.status(404).json({ success: false, message: 'Status not found' });

    const userId = req.user._id.toString();

    if (!reaction || status.reactions.get(userId) === reaction) {
      status.reactions.delete(userId); // toggle off
    } else {
      status.reactions.set(userId, reaction);
    }

    await status.save();

    res.json({ success: true, reactions: Object.fromEntries(status.reactions) });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
//  AI STATUS SUGGESTIONS
// ─────────────────────────────────────────────
const getAISuggestions = async (req, res, next) => {
  try {
    const { mood, context } = req.body; // optional hints from the user

    const user = await User.findById(req.user._id).select('firstName interests lookingFor religion');

    const Anthropic = require('@anthropic-ai/sdk');
    const client    = new Anthropic.Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const prompt = `
You are helping someone write a short dating app status (max 60 characters each).
User info:
- Name: ${user.firstName}
- Interests: ${user.interests?.join(', ') || 'not specified'}
- Looking for: ${user.lookingFor || 'not specified'}
${mood ? `- Current mood: ${mood}` : ''}
${context ? `- Extra context: ${context}` : ''}

Generate exactly 5 short, warm, genuine status suggestions that would attract compatible matches.
Keep them fun, authentic, and under 60 characters.
Absolutely no explicit or suggestive content.
Return ONLY a JSON array of 5 strings. No markdown, no explanation.
`.trim();

    const response = await client.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 200,
      messages:   [{ role: 'user', content: prompt }],
    });

    const raw         = response.content[0]?.text?.trim() ?? '[]';
    const clean       = raw.replace(/```json|```/g, '').trim();
    const suggestions = JSON.parse(clean);

    if (!Array.isArray(suggestions)) throw new Error('Unexpected AI response shape');

    res.json({ success: true, data: suggestions.slice(0, 5) });
  } catch (error) {
    console.error('AI suggestions error:', error.message);
    // Fallback suggestions
    res.json({
      success: true,
      data: [
        'Looking for someone to explore the city with 🌆',
        'Coffee lover seeking a good conversation ☕',
        'Adventure awaits — join me? 🌍',
        'Here for real connections, not just swipes 💜',
        'Laughing my way through life. Come join in 😄',
      ],
    });
  }
};

module.exports = {
  updateLocation,
  getNearbyUsers,
  getMyStatus,
  createStatus,
  deleteStatus,
  reactToStatus,
  getAISuggestions,
};