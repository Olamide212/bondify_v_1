const User = require('../models/User');

const enumNormalizers = {
  lookingFor: {
    'committed-relationship': 'long-term',
    'a-committed-relationship': 'long-term',
    marriage: 'long-term',
    'finding-a-date': 'short-term',
    'something-casual': 'casual',
    'meet-business-oriented-people': 'friendship',
    'i-am-not-sure': 'not-sure',
  },
  children: {
    'i want': 'want-kids',
    i_want: 'want-kids',
    'i want children': 'want-kids',
    i_dont: 'dont-want-kids',
    'i dont': 'dont-want-kids',
    "i don't want children": 'dont-want-kids',
    i_have: 'open-to-kids',
    'i have children and want more': 'open-to-kids',
    dont_want: 'have-kids',
    "i have children and don't want more": 'have-kids',
  },
  drinking: {
    no: 'never',
    occasionally: 'rarely',
    occassionally: 'rarely',
    often: 'regularly',
    'a-lot': 'regularly',
    'prefer-not': 'prefer-not-to-say',
  },
  smoking: {
    no: 'never',
    occasionally: 'rarely',
    occassionally: 'rarely',
    often: 'regularly',
    'a-lot': 'regularly',
    quitting: 'regularly',
    'prefer-not': 'prefer-not-to-say',
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
};

const normalizeEnumField = (key, value) => {
  if (typeof value !== 'string') return value;

  const normalized = value.toLowerCase();
  return enumNormalizers[key]?.[normalized] || value;
};

// @desc    Update user profile
// @route   PATCH /api/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const updates = req.body;

    // Prevent updating sensitive fields
    delete updates.password;
    delete updates.email;
    delete updates.isVerified;
    delete updates.otp;
    delete updates.otpExpiry;

    Object.keys(updates).forEach((key) => {
      updates[key] = normalizeEnumField(key, updates[key]);
    });

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update fields
    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined) {
        // Handle nested location object
        if (key === 'location' && typeof updates[key] === 'object') {
          user.location = { ...user.location, ...updates[key] };
        } else {
          user[key] = updates[key];
        }
      }
    });

    // Recalculate completion percentage
    user.calculateCompletion();

    await user.save();

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

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.onboardingCompleted) {
      return res.status(400).json({
        success: false,
        message: 'Onboarding already completed',
      });
    }

    user.onboardingCompleted = true;
    user.calculateCompletion();
    await user.save();

    res.json({
      success: true,
      message: 'Onboarding completed successfully',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile
// @route   GET /api/profile/:id
// @access  Private
const getProfile = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Hide sensitive information
    const profile = user.toObject();
    delete profile.password;
    delete profile.otp;
    delete profile.otpExpiry;

    res.json({
      success: true,
      data: { profile },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/profile
// @access  Private
const getMyProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: { user },
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
};
