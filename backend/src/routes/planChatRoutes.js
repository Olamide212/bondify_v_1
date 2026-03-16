const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  startGroupChat,
  getMessages,
  sendMessage,
  getChatDetails,
} = require('../controllers/planChatController');

// All routes are protected
router.use(protect);

// Start / get a group chat for a plan
router.post('/:planId/start', startGroupChat);

// Get chat details
router.get('/:chatId', getChatDetails);

// Get messages for a chat
router.get('/:chatId/messages', getMessages);

// Send a message
router.post('/:chatId/messages', sendMessage);

module.exports = router;
