const express = require('express');
const router = express.Router();
const {
  updateProfile,
  completeOnboarding,
  getProfile,
  getMyProfile,
} = require('../controllers/profileController');
const { protect } = require('../middleware/auth');
const { updateProfileValidation } = require('../middleware/validation');

router.get('/', protect, getMyProfile);
router.patch('/', protect, updateProfileValidation, updateProfile);
router.post('/complete-onboarding', protect, completeOnboarding);
router.get('/:id', protect, getProfile);

module.exports = router;
