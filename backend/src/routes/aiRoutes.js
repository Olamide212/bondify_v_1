const express = require('express');
const router = express.Router();
const {
  getIcebreakerSuggestions,
  getCompatibilityScore,
  generateBio,
  getDateIdeas,
  chat,
} = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/icebreakers/:matchId', getIcebreakerSuggestions);
router.get('/compatibility/:userId', getCompatibilityScore);
router.post('/generate-bio', generateBio);
router.get('/date-ideas/:matchId', getDateIdeas);
router.post('/chat', chat);

module.exports = router;