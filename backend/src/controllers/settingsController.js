const User = require('../models/User');
const BlockedUser = require('../models/BlockedUser');
const { generateOTP, calculateOTPExpiry } = require('../config/otp');

// ─────────────────────────────────────────────
//  UPDATE PHONE NUMBER
// ─────────────────────────────────────────────
const updatePhoneNumber = async (req, res, next) => {
  try {
    const { phoneNumber, countryCode } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    const existing = await User.findOne({ phoneNumber, _id: { $ne: req.user._id } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Phone number already in use' });
    }

    const otp = generateOTP();
    const otpExpiry = calculateOTPExpiry();

    await User.findByIdAndUpdate(req.user._id, { phoneNumber, countryCode, otp, otpExpiry });

    // TODO: Send OTP via SMS (Twilio)
    console.log(`Phone update OTP for ${req.user.email}: ${otp}`);

    res.json({
      success: true,
      message: 'OTP sent to your new phone number. Please verify to complete the update.',
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
//  VERIFY PHONE OTP (after update)
// ─────────────────────────────────────────────
const verifyPhoneUpdate = async (req, res, next) => {
  try {
    const { otp } = req.body;

    const user = await User.findById(req.user._id).select('+otp +otpExpiry');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.otp !== otp)
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    if (user.otpExpiry < new Date())
      return res.status(400).json({ success: false, message: 'OTP expired' });

    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.json({ success: true, message: 'Phone number updated successfully' });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
//  UPDATE EMAIL
// ─────────────────────────────────────────────
const updateEmail = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email)
      return res.status(400).json({ success: false, message: 'Email is required' });

    const existing = await User.findOne({ email: email.toLowerCase(), _id: { $ne: req.user._id } });
    if (existing)
      return res.status(400).json({ success: false, message: 'Email already in use' });

    const otp = generateOTP();
    const otpExpiry = calculateOTPExpiry();

    await User.findByIdAndUpdate(req.user._id, { pendingEmail: email.toLowerCase(), otp, otpExpiry });

    // TODO: Send OTP via email (Nodemailer)
    console.log(`Email update OTP for ${req.user.email}: ${otp}`);

    res.json({
      success: true,
      message: 'OTP sent to new email address. Please verify to complete the update.',
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
//  VERIFY EMAIL UPDATE
// ─────────────────────────────────────────────
const verifyEmailUpdate = async (req, res, next) => {
  try {
    const { otp } = req.body;

    const user = await User.findById(req.user._id).select('+otp +otpExpiry +pendingEmail');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.otp !== otp)
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    if (user.otpExpiry < new Date())
      return res.status(400).json({ success: false, message: 'OTP expired' });
    if (!user.pendingEmail)
      return res.status(400).json({ success: false, message: 'No pending email update' });

    user.email = user.pendingEmail;
    user.pendingEmail = undefined;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.json({ success: true, message: 'Email updated successfully' });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
//  CHANGE PASSWORD
// ─────────────────────────────────────────────
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // ── Input validation ────────────────────────────────────────
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'currentPassword, newPassword, and confirmPassword are all required',
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirmation do not match',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long',
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from your current password',
      });
    }

    // ── Verify current password ─────────────────────────────────
    // password is select:false — must be explicitly requested
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // ── Hash & save via pre('save') hook ────────────────────────
    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
//  NOTIFICATION SETTINGS
// ─────────────────────────────────────────────
const getNotificationSettings = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('notificationSettings');
    res.json({ success: true, data: user.notificationSettings });
  } catch (error) {
    next(error);
  }
};

const updateNotificationSettings = async (req, res, next) => {
  try {
    const allowed = [
      'newMatch', 'newMessage', 'newLike', 'superLike',
      'eventReminder', 'emailNotifications', 'pushNotifications', 'marketingEmails',
    ];

    const updates = {};
    allowed.forEach((key) => {
      if (typeof req.body[key] === 'boolean') {
        updates[`notificationSettings.${key}`] = req.body[key];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid settings provided' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('notificationSettings');

    res.json({ success: true, message: 'Notification settings updated', data: user.notificationSettings });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
//  PRIVACY SETTINGS
// ─────────────────────────────────────────────
const getPrivacySettings = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('privacySettings');
    res.json({ success: true, data: user.privacySettings });
  } catch (error) {
    next(error);
  }
};

const updatePrivacySettings = async (req, res, next) => {
  try {
    const allowed = [
      'profileVisibility', 'showLastActive', 'showDistance',
      'showAge', 'showOnlineStatus', 'allowMessageFromNonMatches',
    ];

    const updates = {};
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) {
        updates[`privacySettings.${key}`] = req.body[key];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid settings provided' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('privacySettings');

    res.json({ success: true, message: 'Privacy settings updated', data: user.privacySettings });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
//  BLOCK / UNBLOCK USER
// ─────────────────────────────────────────────
const blockUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { reason, notes } = req.body;

    if (userId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot block yourself' });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const existing = await BlockedUser.findOne({ blocker: req.user._id, blocked: userId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'User already blocked' });
    }

    await BlockedUser.create({ blocker: req.user._id, blocked: userId, reason: reason || 'other', notes });

    res.json({ success: true, message: 'User blocked successfully' });
  } catch (error) {
    next(error);
  }
};

const unblockUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const result = await BlockedUser.findOneAndDelete({ blocker: req.user._id, blocked: userId });
    if (!result) {
      return res.status(404).json({ success: false, message: 'Block record not found' });
    }

    res.json({ success: true, message: 'User unblocked successfully' });
  } catch (error) {
    next(error);
  }
};

const getBlockedUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const blockedList = await BlockedUser.find({ blocker: req.user._id })
      .populate('blocked', 'firstName lastName images verificationStatus')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await BlockedUser.countDocuments({ blocker: req.user._id });

    res.json({
      success: true,
      data: blockedList,
      pagination: { total, page, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
//  DELETE ACCOUNT
// ─────────────────────────────────────────────
const deleteAccount = async (req, res, next) => {
  try {
    const { password, reason } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password' });
    }

    // Soft delete — anonymise PII
    await User.findByIdAndUpdate(req.user._id, {
      isActive: false,
      isDeleted: true,
      deletedAt: new Date(),
      email: `deleted_${req.user._id}@deleted.com`,
      phoneNumber: null,
      firstName: 'Deleted',
      lastName: 'User',
      bio: null,
      images: [],
      pushToken: null,
    });

    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
//  REFERRAL CODE
// ─────────────────────────────────────────────
const getReferralCode = async (req, res, next) => {
  try {
    const { generateReferralCode } = require('../utils/referral');

    let user = await User.findById(req.user._id).select('referralCode referralCount');

    if (!user.referralCode) {
      user.referralCode = generateReferralCode(user._id.toString());
      await user.save();
    }

    res.json({
      success: true,
      data: {
        referralCode: user.referralCode,
        referralCount: user.referralCount,
        referralLink: `https://bondies.app/join?ref=${user.referralCode}`,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
//  UPDATE PUSH TOKEN
// ─────────────────────────────────────────────
const updatePushToken = async (req, res, next) => {
  try {
    const { pushToken } = req.body;

    if (!pushToken) {
      return res.status(400).json({ success: false, message: 'Push token is required' });
    }

    await User.findByIdAndUpdate(req.user._id, { pushToken });

    res.json({ success: true, message: 'Push token updated' });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
//  AI SETTINGS
// ─────────────────────────────────────────────
const getAISettings = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('aiSettings');
    // Return defaults if aiSettings not yet set
    const settings = user.aiSettings || {
      conversationStyle: 'witty',
      showIcebreakers: true,
      profileTips: true,
      personalizedSuggestions: true,
      aiUpdates: true,
    };
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

const updateAISettings = async (req, res, next) => {
  try {
    const allowed = [
      'conversationStyle', 'showIcebreakers', 'profileTips',
      'personalizedSuggestions', 'aiUpdates',
    ];

    const updates = {};
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) {
        // Validate conversationStyle enum
        if (key === 'conversationStyle') {
          if (!['casual', 'witty', 'deep'].includes(req.body[key])) {
            return; // Skip invalid values
          }
        }
        updates[`aiSettings.${key}`] = req.body[key];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid settings provided' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('aiSettings');

    res.json({ success: true, message: 'AI settings updated', data: user.aiSettings });
  } catch (error) {
    next(error);
  }
};

const clearAIChatHistory = async (req, res, next) => {
  try {
    // For now, just return success since chat history is stored locally
    // In future, if we store chat history server-side, implement clearing here
    res.json({ success: true, message: 'Chat history cleared' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  updatePhoneNumber,
  verifyPhoneUpdate,
  updateEmail,
  verifyEmailUpdate,
  changePassword,
  getNotificationSettings,
  updateNotificationSettings,
  getPrivacySettings,
  updatePrivacySettings,
  blockUser,
  unblockUser,
  getBlockedUsers,
  deleteAccount,
  getReferralCode,
  updatePushToken,
  getAISettings,
  updateAISettings,
  clearAIChatHistory,
};