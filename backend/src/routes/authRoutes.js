const express = require('express');
const router = express.Router();
const {
  signup,
  verifyOtp,
  resendOtp,
  login,
  getMe,
  forgotPassword,
  verifyForgotPasswordOtp,
  resetPassword,
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
router.post('/forgot-password', forgotPassword);
router.post('/verify-forgot-password-otp', verifyForgotPasswordOtp);
router.post('/reset-password', resetPassword);
router.get('/me', protect, getMe);

module.exports = router;
