const express = require('express');
const router = express.Router();
const {
  getMessages,
  sendMessage,
  deleteMessage,
  sendDirectMessage,
  editMessage,
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');
const { messageSendLimiter } = require('../middleware/rateLimiters');

router.post('/direct/:userId', protect, messageSendLimiter, sendDirectMessage);
router.get('/:matchId', protect, getMessages);
router.post('/:matchId', protect, messageSendLimiter, sendMessage);

router.patch('/:messageId', protect, editMessage);
router.delete('/:messageId', protect, deleteMessage);

module.exports = router;
