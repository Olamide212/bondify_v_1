const express = require('express');
const router = express.Router();
const {
  getIcebreakerSuggestions,
  getCompatibilityScore,
  generateBio,
  generateBioFromPrompt,
  generatePrompts,
  generateConversationPrompts,
  getDateIdeas,
  chat,
  suggestMessage,
  suggestPhotoComment,
  suggestPost,
} = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/icebreakers/:matchId', getIcebreakerSuggestions);
router.get('/compatibility/:userId', getCompatibilityScore);
router.post('/generate-bio', generateBio);
router.post('/generate-bio-from-prompt', generateBioFromPrompt);
router.get('/generate-prompts', generatePrompts);
router.get('/generate-conversation-prompts', generateConversationPrompts);
router.get('/date-ideas/:matchId', getDateIdeas);
router.post('/chat', chat);
router.post('/suggest-message',       protect, suggestMessage);
router.post('/suggest-photo-comment', protect, suggestPhotoComment);
router.post('/suggest-post',          protect, suggestPost);

module.exports = router;