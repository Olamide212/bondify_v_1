const express = require('express');
const router  = express.Router();
const {
  sendComment,
  getReceivedComments,
  getSentComments,
  markRead,
} = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

// Must come before /:id to avoid param collision
router.get('/received', protect, getReceivedComments);
router.get('/sent',     protect, getSentComments);

router.post('/',            protect, sendComment);
router.patch('/:id/read',   protect, markRead);

module.exports = router;

// ── Register in app.js / server.js ───────────────────────────────────────────
// const commentRoutes = require('./routes/commentRoutes');
// app.use('/api/comments', commentRoutes);