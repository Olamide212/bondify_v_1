const User = require('../models/User');
const BlockedUser = require('../models/BlockedUser');
const Report = require('../models/Report');
const Like = require('../models/Like');
const Match = require('../models/Match');
const Message = require('../models/Message');
const ProfileView = require('../models/ProfileView');
const Notification = require('../models/Notification');
const MessageRequest = require('../models/MessageRequest');
const Follow = require('../models/Follow');
const FriendRequest = require('../models/FriendRequest');
const { generateOTP, calculateOTPExpiry } = require('../config/otp');
const { sendOtpEmail } = require('../utils/termiiService');
const { getRedisClient, isRedisEnabled } = require('../config/redis');

/**
 * Invalidate all discovery cache entries for a given user.
 */
const invalidateDiscoveryCache = async (userId) => {
  if (!isRedisEnabled()) return;
  try {
    const pattern = `discover:${userId}:*`;
    let cursor = 0;
    do {
      const reply = await getRedisClient().scan(cursor, { MATCH: pattern, COUNT: 100 });
      cursor = reply.cursor;
      if (reply.keys.length > 0) {
        await getRedisClient().del(reply.keys);
      }
    } while (cursor !== 0);
  } catch (err) {
    console.error('Settings: discovery cache invalidation error:', err.message);
  }
};

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

    // Store the new phone number in pending fields so we only apply after OTP verification
    await User.findByIdAndUpdate(req.user._id, {
      pendingPhoneNumber: phoneNumber,
      pendingCountryCode: countryCode,
      otp,
      otpExpiry,
    });

    // Send OTP to the user's email for verification
    const user = await User.findById(req.user._id);
    await sendOtpEmail({
      email: user.email,
      firstName: user.firstName,
      otp,
    });

    res.json({
      success: true,
      message: 'OTP sent to your email. Please verify to complete the phone number update.',
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

    const user = await User.findById(req.user._id).select('+otp +otpExpiry +pendingPhoneNumber +pendingCountryCode');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.otp !== otp)
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    if (user.otpExpiry < new Date())
      return res.status(400).json({ success: false, message: 'OTP expired' });

    // Apply the pending phone number now that OTP is verified
    if (user.pendingPhoneNumber) {
      user.phoneNumber = user.pendingPhoneNumber;
      user.countryCode = user.pendingCountryCode || user.countryCode;
      user.pendingPhoneNumber = undefined;
      user.pendingCountryCode = undefined;
    }
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

// ─────────────────────────────────────────────
//  UPDATE BIRTHDAY / DATE OF BIRTH
// ─────────────────────────────────────────────
const updateBirthday = async (req, res, next) => {
  try {
    const { dateOfBirth } = req.body;

    if (!dateOfBirth) {
      return res.status(400).json({ success: false, message: 'Date of birth is required' });
    }

    // Parse and validate the date
    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid date format. Use YYYY-MM-DD' });
    }

    // Calculate age
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age -= 1;
    }

    // Validate age (must be 18+)
    if (age < 18) {
      return res.status(400).json({ success: false, message: 'You must be at least 18 years old' });
    }

    if (age > 120) {
      return res.status(400).json({ success: false, message: 'Please enter a valid date of birth' });
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { dateOfBirth: dob, age },
      { new: true, runValidators: true }
    ).select('dateOfBirth age');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'Birthday updated successfully',
      data: { dateOfBirth: user.dateOfBirth, age: user.age },
    });
  } catch (error) {
    next(error);
  }
};

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
      'blurPhotos',
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

    // Invalidate discovery cache so other users see updated blur/visibility
    await invalidateDiscoveryCache(req.user._id);

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

    // Invalidate discovery cache for both users so the blocked user disappears
    await Promise.all([
      invalidateDiscoveryCache(req.user._id),
      invalidateDiscoveryCache(userId),
    ]);

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
    const totalPages = Math.ceil(total / limit);

    // Transform into the shape the frontend expects
    const blockedUsers = blockedList.map((entry) => {
      const user = entry.blocked;
      return {
        _id: entry._id,
        userId: user?._id,
        name: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Unknown User',
        profilePhoto: user?.images?.[0] || null,
        verificationStatus: user?.verificationStatus,
        blockedAt: entry.createdAt,
        reason: entry.reason,
      };
    });

    res.json({
      success: true,
      data: {
        blockedUsers,
        pagination: { total, page, totalPages, hasMore: page < totalPages },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
//  REPORT USER
// ─────────────────────────────────────────────
const reportUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { reason, details, matchId } = req.body;

    if (userId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot report yourself' });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const existing = await Report.findOne({ reporter: req.user._id, reported: userId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You have already reported this user' });
    }

    await Report.create({
      reporter: req.user._id,
      reported: userId,
      reason: reason || 'other',
      details: details || '',
      matchId: matchId || null,
    });

    res.json({ success: true, message: 'Report submitted successfully' });
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
    const userId = req.user._id;

    const user = await User.findById(userId).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password' });
    }

    const matchIds = await Match.find({
      $or: [{ user1: userId }, { user2: userId }],
    }).distinct('_id');

    await Promise.all([
      Like.deleteMany({ $or: [{ user: userId }, { likedUser: userId }] }),
      BlockedUser.deleteMany({ $or: [{ blocker: userId }, { blocked: userId }] }),
      Report.deleteMany({ $or: [{ reporter: userId }, { reported: userId }] }),
      ProfileView.deleteMany({ $or: [{ viewer: userId }, { viewed: userId }] }),
      Notification.deleteMany({ $or: [{ recipient: userId }, { sender: userId }] }),
      MessageRequest.deleteMany({ $or: [{ fromUser: userId }, { toUser: userId }] }),
      Follow.deleteMany({ $or: [{ follower: userId }, { following: userId }] }),
      FriendRequest.deleteMany({ $or: [{ sender: userId }, { receiver: userId }] }),
      Match.deleteMany({ $or: [{ user1: userId }, { user2: userId }] }),
      Message.deleteMany({
        $or: [
          { sender: userId },
          { receiver: userId },
          { match: { $in: matchIds } },
        ],
      }),
      User.findByIdAndDelete(userId),
    ]);

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

    // Validate conversationStyle if provided
    if (req.body.conversationStyle !== undefined && 
        !['casual', 'witty', 'deep'].includes(req.body.conversationStyle)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid conversation style. Must be one of: casual, witty, deep' 
      });
    }

    const updates = {};
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) {
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
  updateBirthday,
  changePassword,
  getNotificationSettings,
  updateNotificationSettings,
  getPrivacySettings,
  updatePrivacySettings,
  blockUser,
  unblockUser,
  getBlockedUsers,
  reportUser,
  deleteAccount,
  getReferralCode,
  updatePushToken,
  getAISettings,
  updateAISettings,
  clearAIChatHistory,
};