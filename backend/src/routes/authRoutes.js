const express = require('express');
const router = express.Router();
const {
  signup,
  verifyOtp,
  resendOtp,
  login,
  getMe,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const {
  signupValidation,
  loginValidation,
  verifyOtpValidation,
} = require('../middleware/validation');

router.post('/signup', signupValidation, signup);
router.post('/verify-otp', verifyOtpValidation, verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/login', loginValidation, login);
router.get('/me', protect, getMe);

module.exports = router;
