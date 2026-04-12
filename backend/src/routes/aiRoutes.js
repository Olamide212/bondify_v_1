const express = require('express');
const router = express.Router();
const {
  getIcebreakerSuggestions,
  getCompatibilityScore,
  getMatchSuggestion,
  generateBio,
  generateBioFromPrompt,
  generatePrompts,
  generateConversationPrompts,
  generateProfileQuestions,
  generateMusicSuggestions,
  generateVideoSuggestions,
  generateActivitySuggestions,
  getDateIdeas,
  chat,
  suggestMessage,
  suggestPhotoComment,
  suggestPost,
  searchProfiles,
  findMyMatches,
  suggestReplies,
} = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/icebreakers/:matchId', getIcebreakerSuggestions);
router.get('/compatibility/:userId', getCompatibilityScore);
router.get('/match-suggestion/:userId', getMatchSuggestion);
router.post('/generate-bio', generateBio);
router.post('/generate-bio-from-prompt', generateBioFromPrompt);
router.get('/generate-prompts', generatePrompts);
router.get('/generate-conversation-prompts', generateConversationPrompts);
router.get('/generate-profile-questions', generateProfileQuestions);
router.get('/generate-music-suggestions', generateMusicSuggestions);
router.get('/generate-video-suggestions', generateVideoSuggestions);
router.get('/generate-activity-suggestions', generateActivitySuggestions);
router.get('/date-ideas/:matchId', getDateIdeas);
router.post('/chat', chat);
router.post('/suggest-message', suggestMessage);
router.post('/suggest-photo-comment', suggestPhotoComment);
router.post('/suggest-post', suggestPost);
router.post('/suggest-replies', suggestReplies);

// ── BonBot profile search ───────────────────────────────────────────────────
// Natural-language query → GPT extracts filters → DB query → ranked profiles
router.post('/search-profiles', searchProfiles);

// ── AI Find My Matches ─────────────────────────────────────────────────────
// Analyzes user profile + candidate pool → AI-ranked top matches
router.get('/find-my-matches', findMyMatches);

module.exports = router;