const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  startBondupChat,
  getBondupChatDetails,
  getBondupMessages,
  sendBondupMessage,
} = require('../controllers/bondupChatController');

router.use(protect);

// Start / get a chat for a Bondup
router.post('/:bondupId/start', startBondupChat);

// Get chat details
router.get('/:chatId', getBondupChatDetails);

// Messages
router.get('/:chatId/messages', getBondupMessages);
router.post('/:chatId/messages', sendBondupMessage);

module.exports = router;
