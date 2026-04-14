const express = require('express');
const router = express.Router();
const {
  createMessageRequest,
  getReceivedRequests,
  getSentRequests,
  acceptRequest,
  declineRequest,
  getPendingCount,
  markAsRead,
} = require('../controllers/messageRequestController');
const { protect } = require('../middleware/auth');

// ── Message Request Routes ────────────────────────────────────────────────────

// Static routes must come before parameterized routes
router.get('/received',  protect, getReceivedRequests);  // GET  /api/message-requests/received
router.get('/sent',      protect, getSentRequests);      // GET  /api/message-requests/sent
router.get('/count',     protect, getPendingCount);      // GET  /api/message-requests/count
router.patch('/mark-read', protect, markAsRead);         // PATCH /api/message-requests/mark-read

router.post('/',              protect, createMessageRequest); // POST  /api/message-requests
router.patch('/:id/accept',   protect, acceptRequest);        // PATCH /api/message-requests/:id/accept
router.patch('/:id/decline',  protect, declineRequest);       // PATCH /api/message-requests/:id/decline

module.exports = router;

// ── Register in server.js ─────────────────────────────────────────────────────
// const messageRequestRoutes = require('./routes/messageRequestRoutes');
// app.use('/api/message-requests', messageRequestRoutes);
