const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
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
} = require('../controllers/settingsController');

// ── Account ───────────────────────────────────────────────────────────────────
router.patch('/phone',        protect, updatePhoneNumber);    // PATCH  /api/settings/phone
router.post('/phone/verify',  protect, verifyPhoneUpdate);    // POST   /api/settings/phone/verify
router.patch('/email',        protect, updateEmail);           // PATCH  /api/settings/email
router.post('/email/verify',  protect, verifyEmailUpdate);    // POST   /api/settings/email/verify
router.patch('/password',     protect, changePassword);        // PATCH  /api/settings/password
router.delete('/account',     protect, deleteAccount);         // DELETE /api/settings/account

// ── Notifications ─────────────────────────────────────────────────────────────
router.get('/notifications',   protect, getNotificationSettings);    // GET   /api/settings/notifications
router.patch('/notifications', protect, updateNotificationSettings); // PATCH /api/settings/notifications

// ── Privacy ───────────────────────────────────────────────────────────────────
router.get('/privacy',   protect, getPrivacySettings);    // GET   /api/settings/privacy
router.patch('/privacy', protect, updatePrivacySettings); // PATCH /api/settings/privacy

// ── Block ─────────────────────────────────────────────────────────────────────
router.post('/block/:userId',   protect, blockUser);       // POST   /api/settings/block/:userId
router.delete('/block/:userId', protect, unblockUser);     // DELETE /api/settings/block/:userId
router.get('/blocked-users',    protect, getBlockedUsers); // GET    /api/settings/blocked-users

// ── Misc ──────────────────────────────────────────────────────────────────────
router.get('/referral',     protect, getReferralCode); // GET   /api/settings/referral
router.patch('/push-token', protect, updatePushToken); // PATCH /api/settings/push-token

module.exports = router;