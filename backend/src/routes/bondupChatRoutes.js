const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  startBondupChat,
  getBondupChatDetails,
  getBondupMessages,
  sendBondupMessage,
  getBondupChatState,
  requestMatch,
  declineMatch,
  getBondupUserProfile,
} = require('../controllers/bondupChatController');

router.use(protect);

// Start / get a chat for a Bondup
router.post('/:bondupId/start', startBondupChat);

// Get chat details
router.get('/:chatId', getBondupChatDetails);

// Chat state (match status, message limits)
router.get('/:chatId/state', getBondupChatState);

// Match actions
router.post('/:chatId/match', requestMatch);
router.post('/:chatId/unmatch', declineMatch);

// Messages
router.get('/:chatId/messages', getBondupMessages);
router.post('/:chatId/messages', sendBondupMessage);

// Bondup user profile (within chat context)
router.get('/:chatId/user-profile/:userId', getBondupUserProfile);

module.exports = router;
