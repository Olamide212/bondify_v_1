/**
 * Communication Routes
 * 
 * Routes for communication scoring and feedback system.
 */

const express = require('express');
const router = express.Router();
const {
  submitFeedback,
  getCommunicationScore,
  getMyFeedback,
  shouldPromptFeedback,
} = require('../controllers/communicationController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Submit feedback about a user's communication
router.post('/feedback', submitFeedback);

// Get a user's communication score (public within matches)
router.get('/score/:userId', getCommunicationScore);

// Get feedback you've given for a specific match
router.get('/my-feedback/:matchId', getMyFeedback);

// Check if should prompt for feedback
router.get('/should-prompt/:matchId', shouldPromptFeedback);

module.exports = router;
