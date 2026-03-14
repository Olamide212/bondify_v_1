const {
  PutObjectCommand,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3');
const s3 = require('../config/s3');
const User = require('../models/User');
const Match = require('../models/Match');
const ProfileView = require('../models/ProfileView');
const Notification = require('../models/Notification');
const { getIO } = require('../socket');
const { mapImagesWithAccessUrls } = require('../utils/imageHelper');

const PROFILE_CACHE_TTL_MS = Number(process.env.PROFILE_CACHE_TTL_MS || 30000);
const profileCache = new Map();

const getCachedProfile = (key) => {
  const cachedEntry = profileCache.get(key);
  if (!cachedEntry) return null;
  const isExpired = Date.now() - cachedEntry.cachedAt > PROFILE_CACHE_TTL_MS;
  if (isExpired) { profileCache.delete(key); return null; }
  return cachedEntry.data;
};

const setCachedProfile = (key, data) => {
  profileCache.set(key, { data, cachedAt: Date.now() });
};

const clearProfileCache = (userId) => {
  if (!userId) return;
  profileCache.delete(`my:${String(userId)}`);
  profileCache.delete(`id:${String(userId)}`);
};

// ─── S3 helpers (same pattern as uploadController) ───────────────────────────

const getVoicePromptObjectKey = (userId, originalname) => {
  const fallbackExt = 'm4a';
  const extension = originalname?.includes('.')
    ? originalname.split('.').pop().toLowerCase()
    : fallbackExt;
  const safeExt = /^[a-z0-9]+$/.test(extension) ? extension : fallbackExt;
  return `bondies/voice_prompts/${userId}/${Date.now()}-${Math.round(Math.random() * 1e9)}.${safeExt}`;
};

const getPublicUrl = (bucket, key) => {
  const baseUrl = process.env.AWS_S3_PUBLIC_BASE_URL;
  if (baseUrl) return `${baseUrl.replace(/\/$/, '')}/${key}`;
  const region = process.env.AWS_REGION;
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
};

// ─────────────────────────────────────────────────────────────────────────────

const enumNormalizers = {
  lookingFor: {
    'committed-relationship': 'Long term', 'a-committed-relationship': 'Long term',
    marriage: 'Long term', 'long-term': 'Long term',
    'finding-a-date': 'Short term', 'short-term': 'Short term',
    'something-casual': 'Something Casual', casual: 'Something Casual',
    'meet-business-oriented-people': 'Meet business oriented people', friendship: 'Meet business oriented people',
    'i-am-not-sure': 'I am not sure', 'not-sure': 'I am not sure',
  },
  children: {
    'i want': 'I want kids', i_want: 'I want kids', 'i want children': 'I want kids', 'want-kids': 'I want kids',
    i_dont: "I don't want kids", 'i dont': "I don't want kids", "i don't want children": "I don't want kids", 'dont-want-kids': "I don't want kids",
    i_have: 'I have kids', 'i have children and want more': 'I am open to kids', 'open-to-kids': 'I am open to kids',
    dont_want: 'I have kids', "i have children and don't want more": 'I have kids', 'have-kids': 'I have kids',
    'prefer-not-to-say': 'I prefer not to say',
  },
  drinking: {
    no: "No, I don't drink", never: "No, I don't drink",
    occasionally: 'Rarely', occassionally: 'Rarely', rarely: 'Rarely',
    socially: 'Socially', often: 'Regularly', 'a-lot': 'Regularly', regularly: 'Regularly',
    'prefer-not': 'Prefer not to say', 'prefer-not-to-say': 'Prefer not to say',
  },
  smoking: {
    no: "No, I don't smoke", never: "No, I don't smoke",
    occasionally: 'Occasionally', occassionally: 'Occasionally', rarely: 'Occasionally',
    socially: 'Socially', often: 'Regularly', 'a-lot': 'Regularly', regularly: 'Regularly', quitting: 'Regularly',
    'prefer-not': 'Prefer not to say', 'prefer-not-to-say': 'Prefer not to say',
  },
  financialStyle: { frugal: 'saver', moderate: 'balanced', generous: 'spender', luxury: 'spender', 'prefer-not': 'prefer-not-to-say' },
  loveLanguage: { words: 'words-of-affirmation', acts: 'acts-of-service', gifts: 'receiving-gifts', time: 'quality-time', touch: 'physical-touch' },
  communicationStyle: { humorous: 'balanced', deep: 'emotional', 'prefer-not': 'balanced' },
  religionImportance: {
    'is-very-important': 'Is very important', 'very-important': 'Is very important',
    'is-quite-important': 'Is quite important', 'quite-important': 'Is quite important',
    'not-matter': "It doesn't matter to me at all", 'not-important': "It doesn't matter to me at all",
  },
  gender: { male: 'Male', female: 'Female', 'non-binary': 'Non-binary', other: 'Other' },
};

const normalizeEnumField = (key, value) => {
  if (typeof value !== 'string') return value;
  const normalized = value.toLowerCase();
  return enumNormalizers[key]?.[normalized] || value;
};

const calculateAgeFromDate = (dobInput) => {
  const dob = new Date(dobInput);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age -= 1;
  return age;
};

const normalizeBirthFields = (updates) => {
  const n = { ...updates };
  let dob = n.dateOfBirth || n.birthdate || null;
  if (!dob && n.birthYear && n.birthMonth !== undefined && n.birthDay) {
    const month = String(Number(n.birthMonth) + 1).padStart(2, '0');
    const day   = String(n.birthDay).padStart(2, '0');
    dob = `${n.birthYear}-${month}-${day}`;
  }
  if (dob) {
    const parsed = new Date(dob);
    if (!Number.isNaN(parsed.getTime())) {
      n.dateOfBirth = parsed;
      const age = calculateAgeFromDate(parsed);
      if (typeof age === 'number' && !Number.isNaN(age)) n.age = age;
    }
  }
  delete n.birthdate; delete n.birthYear; delete n.birthMonth; delete n.birthDay;
  return n;
};

// ─────────────────────────────────────────────────────────────────────────────
//  VOICE PROMPT — AWS S3
// ─────────────────────────────────────────────────────────────────────────────

// @desc    Upload or replace voice prompt
// @route   POST /api/profile/voice-prompt
// @access  Private
// Middleware: upload.single('voicePrompt')  (reuse multer memoryStorage instance)
const uploadVoicePrompt = async (req, res, next) => {
  try {
    const userId = req.user._id;
    // Use a dedicated voice bucket env var if set, otherwise fall back to the main bucket
    const bucket = process.env.AWS_S3_VOICE_BUCKET || process.env.AWS_S3_BUCKET;

    if (!bucket) {
      return res.status(500).json({ success: false, message: 'Missing AWS_S3_BUCKET configuration' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No audio file provided' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Delete previous voice prompt from S3 if one exists
    if (user.voicePromptKey) {
      await s3
        .send(new DeleteObjectCommand({ Bucket: bucket, Key: user.voicePromptKey }))
        .catch(() => {}); // non-fatal
    }

    // Upload new audio to S3
    const objectKey = getVoicePromptObjectKey(userId, req.file.originalname);

    await s3.send(
      new PutObjectCommand({
        Bucket:      bucket,
        Key:         objectKey,
        Body:        req.file.buffer,
        ContentType: req.file.mimetype || 'audio/m4a',
      })
    );

    user.voicePrompt    = getPublicUrl(bucket, objectKey);
    user.voicePromptKey = objectKey; // stored so we can delete it later
    user.calculateCompletion();
    await user.save();

    clearProfileCache(userId);

    res.json({
      success: true,
      message: 'Voice prompt uploaded successfully',
      data: {
        voicePrompt:    user.voicePrompt,
        voicePromptKey: user.voicePromptKey,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete voice prompt
// @route   DELETE /api/profile/voice-prompt
// @access  Private
const deleteVoicePrompt = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const bucket = process.env.AWS_S3_VOICE_PROMPT_BUCKET || process.env.AWS_S3_BUCKET;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.voicePromptKey) {
      await s3
        .send(new DeleteObjectCommand({ Bucket: bucket, Key: user.voicePromptKey }))
        .catch(() => {});
    }

    user.voicePrompt    = null;
    user.voicePromptKey = null;
    user.calculateCompletion();
    await user.save();

    clearProfileCache(userId);

    res.json({ success: true, message: 'Voice prompt deleted' });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  EXISTING CONTROLLERS
// ─────────────────────────────────────────────────────────────────────────────

// @desc    Update user profile
// @route   PATCH /api/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    let updates  = req.body;

    delete updates.password;
    delete updates.email;
    delete updates.isVerified;
    delete updates.otp;
    delete updates.otpExpiry;
    // voice prompt has its own dedicated endpoint — block via general update
    delete updates.voicePrompt;
    delete updates.voicePromptKey;

    updates = normalizeBirthFields(updates);
    Object.keys(updates).forEach((key) => { updates[key] = normalizeEnumField(key, updates[key]); });

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined) {
        if (key === 'location' && typeof updates[key] === 'object') {
          user.location = { ...user.location, ...updates[key] };
        } else {
          user[key] = updates[key];
        }
      }
    });

    user.calculateCompletion();
    await user.save();
    clearProfileCache(user._id);

    res.json({ success: true, message: 'Profile updated successfully', data: { user } });
  } catch (error) {
    next(error);
  }
};

// @desc    Complete onboarding
// @route   POST /api/profile/complete-onboarding
// @access  Private
const completeOnboarding = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const user   = await User.findById(userId);

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.onboardingCompleted) return res.status(400).json({ success: false, message: 'Onboarding already completed' });

    user.onboardingCompleted = true;
    user.calculateCompletion();
    await user.save();
    clearProfileCache(user._id);

    res.json({ success: true, message: 'Onboarding completed successfully', data: { user } });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile by ID
// @route   GET /api/profile/:id
// @access  Private
const getProfile = async (req, res, next) => {
  try {
    const { id }   = req.params;
    const viewerId = req.user._id;
    const viewerInfo = { firstName: req.user.firstName, lastName: req.user.lastName, images: req.user.images };
    const cacheKey = `id:${String(id)}`;

    const cached = getCachedProfile(cacheKey);
    if (cached) {
      // Fire-and-forget: record the visit even for cached responses
      if (String(viewerId) !== String(id)) {
        recordProfileVisit(viewerId, id, viewerInfo);
      }
      return res.json({ success: true, data: { profile: cached } });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const profile = user.toObject();
    delete profile.password; delete profile.otp; delete profile.otpExpiry;
    profile.images = await mapImagesWithAccessUrls(profile.images);

    setCachedProfile(cacheKey, profile);

    // Fire-and-forget: record the visit & increment profileViews counter
    if (String(viewerId) !== String(id)) {
      recordProfileVisit(viewerId, id, viewerInfo);
      User.findByIdAndUpdate(id, { $inc: { profileViews: 1 } }).exec();
    }

    res.json({ success: true, data: { profile } });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/profile
// @access  Private
const getMyProfile = async (req, res, next) => {
  try {
    const cacheKey = `my:${String(req.user._id)}`;

    const cached = getCachedProfile(cacheKey);
    if (cached) return res.json({ success: true, data: { user: cached } });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const responseUser = {
      ...user.toObject(),
      images: await mapImagesWithAccessUrls(user.images),
    };

    setCachedProfile(cacheKey, responseUser);
    res.json({ success: true, data: { user: responseUser } });
  } catch (error) {
    next(error);
  }
};


// ─────────────────────────────────────────────────────────────────────────────
//  PASTE INTO YOUR EXISTING profileController.js
//  Requires: Match model (already imported in matchController — add to profile
//  controller imports if not there):
//    const Match = require('../models/Match');
//  Then add  getProfileStats  to module.exports.
// ─────────────────────────────────────────────────────────────────────────────

// @desc    Get current user's profile stats (matches, likes received, profile views)
// @route   GET /api/profile/stats
// @access  Private
const getProfileStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Run all three counts in parallel for speed
    const [user, matchCount] = await Promise.all([
      // likesReceived is already maintained on the User document
      User.findById(userId).select('likesReceived profileViews'),

      // Count active matches where this user is a participant
      Match.countDocuments({
        users:  { $elemMatch: { $eq: userId } },
        status: 'matched',
      }),
    ]);

    res.json({
      success: true,
      data: {
        matches:      matchCount              ?? 0,
        likes:        user?.likesReceived     ?? 0,
        profileViews: user?.profileViews      ?? 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Profile view tracker ─────────────────────────────────────────────────────
// Records a profile visit and emits a real-time socket notification to the
// viewed user if they are online.
// viewerInfo: { firstName, lastName, images } — passed from the calling context
//   to avoid a separate DB lookup for the viewer.
const recordProfileVisit = async (viewerId, viewedId, viewerInfo = {}) => {
  try {
    await ProfileView.findOneAndUpdate(
      { viewer: viewerId, viewed: viewedId },
      { viewer: viewerId, viewed: viewedId },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const viewerName = [viewerInfo.firstName, viewerInfo.lastName].filter(Boolean).join(' ') || 'Someone';
    const viewerImage = viewerInfo.images?.[0]?.url || viewerInfo.images?.[0] || null;

    // Emit socket event so the viewed user sees it in real-time
    try {
      const io = getIO();
      io.to(`user:${String(viewedId)}`).emit('profile:visited', {
        type:      'profile_visit',
        title:     `${viewerName} visited you`,
        body:      `${viewerName} just viewed your profile`,
        userId:    String(viewerId),
        userName:  viewerName,
        userImage: viewerImage,
        createdAt: new Date().toISOString(),
      });
    } catch (_socketErr) {
      // Socket may not be initialized in test environments
    }

    // Persist a notification record
    await Notification.create({
      recipient: viewedId,
      sender:    viewerId,
      type:      'profile_visit',
      title:     `${viewerName} visited you`,
      body:      `${viewerName} just viewed your profile`,
      data:      { viewerId: String(viewerId) },
    });
  } catch (err) {
    // Fire-and-forget — don't let tracking errors affect the main response
    console.error('recordProfileVisit error:', err?.message);
  }
};

// @desc    Get users who visited the current user's profile
// @route   GET /api/profile/visitors
// @access  Private
const getProfileVisitors = async (req, res, next) => {
  try {
    const userId        = req.user._id;
    const sanitizedPage = Math.max(parseInt(req.query.page  || 1,  10), 1);
    const sanitizedLimit= Math.min(Math.max(parseInt(req.query.limit || 20, 10), 1), 100);
    const skip          = (sanitizedPage - 1) * sanitizedLimit;

    const [views, total] = await Promise.all([
      ProfileView.find({ viewed: userId })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(sanitizedLimit)
        .populate('viewer', '-password -otp -otpExpiry')
        .lean(),
      ProfileView.countDocuments({ viewed: userId }),
    ]);

    const profiles = await Promise.all(
      views.map(async (view) => {
        if (!view.viewer) return null;
        const userObj   = { ...view.viewer };
        userObj.images  = await mapImagesWithAccessUrls(userObj.images);
        userObj.visitedAt = view.updatedAt;
        return userObj;
      })
    );

    return res.json({
      success: true,
      data: {
        profiles: profiles.filter(Boolean),
        pagination: {
          page:  sanitizedPage,
          limit: sanitizedLimit,
          total,
          pages: Math.ceil(total / sanitizedLimit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  updateProfile,
  completeOnboarding,
  getProfile,
  getMyProfile,
  uploadVoicePrompt,
  deleteVoicePrompt,
  getProfileStats,
  getProfileVisitors,
};