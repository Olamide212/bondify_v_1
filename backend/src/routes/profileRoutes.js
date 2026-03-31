const express = require('express');
const multer  = require('multer');
const router  = express.Router();

const {
  updateProfile,
  completeOnboarding,
  getProfile,
  getMyProfile,
  getProfileStats,
  getProfileVisitors,
  uploadVoicePrompt,
  deleteVoicePrompt,
  boostProfile,
} = require('../controllers/profileController');

const { protect }                 = require('../middleware/auth');
const { updateProfileValidation } = require('../middleware/validation');

// multer memoryStorage — same as uploadController
const upload = multer({ storage: multer.memoryStorage() });

// ── Profile routes ────────────────────────────────────────────────────────────
router.get('/',    protect, getMyProfile);
router.patch('/',  protect, updateProfileValidation, updateProfile);
router.post('/complete-onboarding', protect, completeOnboarding);
router.get('/stats', protect, getProfileStats);   // GET /api/profile/stats
router.get('/visitors', protect, getProfileVisitors); // GET /api/profile/visitors
router.post('/boost', protect, boostProfile); // POST /api/profile/boost

// ── Voice prompt — must come BEFORE /:id so Express doesn't treat
//    "voice-prompt" as a dynamic :id param ──────────────────────────────────
router.post('/voice-prompt',   protect, upload.single('voicePrompt'), uploadVoicePrompt);
router.delete('/voice-prompt', protect, deleteVoicePrompt);

// ── Parameterised route last ──────────────────────────────────────────────────
router.get('/:id', protect, getProfile);

module.exports = router;