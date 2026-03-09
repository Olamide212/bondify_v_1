const User = require('../models/User');
const { mapImagesWithAccessUrls } = require('../utils/imageHelper');
const cloudinary = require('../utils/cloudinary'); // adjust path as needed

const PROFILE_CACHE_TTL_MS = Number(process.env.PROFILE_CACHE_TTL_MS || 30000);
const profileCache = new Map();

const getCachedProfile = (key) => {
  const cachedEntry = profileCache.get(key);
  if (!cachedEntry) return null;

  const isExpired = Date.now() - cachedEntry.cachedAt > PROFILE_CACHE_TTL_MS;
  if (isExpired) {
    profileCache.delete(key);
    return null;
  }

  return cachedEntry.data;
};

const setCachedProfile = (key, data) => {
  profileCache.set(key, {
    data,
    cachedAt: Date.now(),
  });
};

const clearProfileCache = (userId) => {
  if (!userId) return;
  profileCache.delete(`my:${String(userId)}`);
  profileCache.delete(`id:${String(userId)}`);
};

const enumNormalizers = {
  lookingFor: {
    'committed-relationship': 'Long term',
    'a-committed-relationship': 'Long term',
    marriage: 'Long term',
    'long-term': 'Long term',
    'finding-a-date': 'Short term',
    'short-term': 'Short term',
    'something-casual': 'Something Casual',
    casual: 'Something Casual',
    'meet-business-oriented-people': 'Meet business oriented people',
    friendship: 'Meet business oriented people',
    'i-am-not-sure': 'I am not sure',
    'not-sure': 'I am not sure',
  },
  children: {
    'i want': 'I want kids',
    i_want: 'I want kids',
    'i want children': 'I want kids',
    'want-kids': 'I want kids',
    i_dont: "I don't want kids",
    'i dont': "I don't want kids",
    "i don't want children": "I don't want kids",
    'dont-want-kids': "I don't want kids",
    i_have: 'I have kids',
    'i have children and want more': 'I am open to kids',
    'open-to-kids': 'I am open to kids',
    dont_want: 'I have kids',
    "i have children and don't want more": 'I have kids',
    'have-kids': 'I have kids',
    'prefer-not-to-say': 'I prefer not to say',
  },
  drinking: {
    no: "No, I don't drink",
    never: "No, I don't drink",
    occasionally: 'Rarely',
    occassionally: 'Rarely',
    rarely: 'Rarely',
    socially: 'Socially',
    often: 'Regularly',
    'a-lot': 'Regularly',
    regularly: 'Regularly',
    'prefer-not': 'Prefer not to say',
    'prefer-not-to-say': 'Prefer not to say',
  },
  smoking: {
    no: "No, I don't smoke",
    never: "No, I don't smoke",
    occasionally: 'Occasionally',
    occassionally: 'Occasionally',
    rarely: 'Occasionally',
    socially: 'Socially',
    often: 'Regularly',
    'a-lot': 'Regularly',
    regularly: 'Regularly',
    quitting: 'Regularly',
    'prefer-not': 'Prefer not to say',
    'prefer-not-to-say': 'Prefer not to say',
  },
  financialStyle: {
    frugal: 'saver',
    moderate: 'balanced',
    generous: 'spender',
    luxury: 'spender',
    'prefer-not': 'prefer-not-to-say',
  },
  loveLanguage: {
    words: 'words-of-affirmation',
    acts: 'acts-of-service',
    gifts: 'receiving-gifts',
    time: 'quality-time',
    touch: 'physical-touch',
  },
  communicationStyle: {
    humorous: 'balanced',
    deep: 'emotional',
    'prefer-not': 'balanced',
  },
  religionImportance: {
    'is-very-important': 'Is very important',
    'very-important': 'Is very important',
    'is-quite-important': 'Is quite important',
    'quite-important': 'Is quite important',
    'not-matter': "It doesn't matter to me at all",
    'not-important': "It doesn't matter to me at all",
  },
  gender: {
    male: 'Male',
    female: 'Female',
    'non-binary': 'Non-binary',
    other: 'Other',
  },
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

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }

  return age;
};

const normalizeBirthFields = (updates) => {
  const normalizedUpdates = { ...updates };

  let dateOfBirthValue =
    normalizedUpdates.dateOfBirth ||
    normalizedUpdates.birthdate ||
    null;

  if (
    !dateOfBirthValue &&
    normalizedUpdates.birthYear &&
    normalizedUpdates.birthMonth !== undefined &&
    normalizedUpdates.birthDay
  ) {
    const month = String(Number(normalizedUpdates.birthMonth) + 1).padStart(2, '0');
    const day = String(normalizedUpdates.birthDay).padStart(2, '0');
    dateOfBirthValue = `${normalizedUpdates.birthYear}-${month}-${day}`;
  }

  if (dateOfBirthValue) {
    const parsedDate = new Date(dateOfBirthValue);
    if (!Number.isNaN(parsedDate.getTime())) {
      normalizedUpdates.dateOfBirth = parsedDate;
      const computedAge = calculateAgeFromDate(parsedDate);
      if (typeof computedAge === 'number' && !Number.isNaN(computedAge)) {
        normalizedUpdates.age = computedAge;
      }
    }
  }

  delete normalizedUpdates.birthdate;
  delete normalizedUpdates.birthYear;
  delete normalizedUpdates.birthMonth;
  delete normalizedUpdates.birthDay;

  return normalizedUpdates;
};

// ─────────────────────────────────────────────────────────────────────────────
//  VOICE PROMPT UPLOAD
//  Receives a local file URI from the app (multipart/form-data, field: "voicePrompt")
//  Uploads to Cloudinary under resource_type: 'video' (Cloudinary stores audio as video)
//  Returns a signed URL stored on user.voicePrompt
// ─────────────────────────────────────────────────────────────────────────────

// @desc    Upload or replace voice prompt
// @route   POST /api/profile/voice-prompt
// @access  Private
const uploadVoicePrompt = async (req, res, next) => {
  try {
    const userId = req.user._id;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No audio file provided.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Delete old voice prompt from Cloudinary if it exists
    if (user.voicePromptPublicId) {
      await cloudinary.uploader.destroy(user.voicePromptPublicId, { resource_type: 'video' }).catch(() => {});
    }

    // Upload new audio to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'video', // Cloudinary treats audio as video
          folder: `bondies/voice_prompts/${String(userId)}`,
          public_id: `voice_${Date.now()}`,
          overwrite: true,
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    user.voicePrompt         = uploadResult.secure_url;
    user.voicePromptPublicId = uploadResult.public_id;
    user.calculateCompletion();
    await user.save();

    clearProfileCache(userId);

    res.json({
      success: true,
      message: 'Voice prompt uploaded successfully.',
      data: {
        voicePrompt: user.voicePrompt,
        voicePromptPublicId: user.voicePromptPublicId,
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
    const user   = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.voicePromptPublicId) {
      await cloudinary.uploader.destroy(user.voicePromptPublicId, { resource_type: 'video' }).catch(() => {});
    }

    user.voicePrompt         = null;
    user.voicePromptPublicId = null;
    user.calculateCompletion();
    await user.save();

    clearProfileCache(userId);

    res.json({ success: true, message: 'Voice prompt deleted.' });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  EXISTING CONTROLLERS (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

// @desc    Update user profile
// @route   PATCH /api/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    let updates = req.body;

    // Prevent updating sensitive fields
    delete updates.password;
    delete updates.email;
    delete updates.isVerified;
    delete updates.otp;
    delete updates.otpExpiry;
    // voice prompt is handled by its own endpoint
    delete updates.voicePrompt;
    delete updates.voicePromptPublicId;

    updates = normalizeBirthFields(updates);

    Object.keys(updates).forEach((key) => {
      updates[key] = normalizeEnumField(key, updates[key]);
    });

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

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user },
    });
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

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.onboardingCompleted) {
      return res.status(400).json({ success: false, message: 'Onboarding already completed' });
    }

    user.onboardingCompleted = true;
    user.calculateCompletion();
    await user.save();

    clearProfileCache(user._id);

    res.json({
      success: true,
      message: 'Onboarding completed successfully',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile by ID
// @route   GET /api/profile/:id
// @access  Private
const getProfile = async (req, res, next) => {
  try {
    const { id }     = req.params;
    const cacheKey   = `id:${String(id)}`;

    const cachedProfile = getCachedProfile(cacheKey);
    if (cachedProfile) {
      return res.json({ success: true, data: { profile: cachedProfile } });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const profile = user.toObject();
    delete profile.password;
    delete profile.otp;
    delete profile.otpExpiry;
    profile.images = await mapImagesWithAccessUrls(profile.images);

    setCachedProfile(cacheKey, profile);

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

    const cachedProfile = getCachedProfile(cacheKey);
    if (cachedProfile) {
      return res.json({ success: true, data: { user: cachedProfile } });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

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

module.exports = {
  updateProfile,
  completeOnboarding,
  getProfile,
  getMyProfile,
  uploadVoicePrompt,
  deleteVoicePrompt,
};