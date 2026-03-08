const express = require('express');
const router = express.Router();
const {
  updatePhoneNumber,
  verifyPhoneUpdate,
  updateEmail,
  verifyEmailUpdate,
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
} = require('../controllers/settingsController');
const { protect } = require('../middleware/auth');

// All settings routes require authentication
router.use(protect);

// Phone & Email
router.patch('/phone', updatePhoneNumber);
router.post('/phone/verify', verifyPhoneUpdate);
router.patch('/email', updateEmail);
router.post('/email/verify', verifyEmailUpdate);

// Notification Settings
router.get('/notifications', getNotificationSettings);
router.patch('/notifications', updateNotificationSettings);

// Privacy Settings
router.get('/privacy', getPrivacySettings);
router.patch('/privacy', updatePrivacySettings);

// Block/Unblock
router.post('/block/:userId', blockUser);
router.delete('/block/:userId', unblockUser);
router.get('/blocked-users', getBlockedUsers);

// Delete Account
router.delete('/account', deleteAccount);

// Referral
router.get('/referral-code', getReferralCode);

// Push Token
router.patch('/push-token', updatePushToken);

module.exports = router;
