const { body, param, query, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array(),
    });
  }
  next();
};

const signupValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  validate,
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];

const verifyOtpValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  validate,
];

const updateProfileValidation = [
  body('email').optional().isEmail().normalizeEmail(),
  body('age').optional().isInt({ min: 18, max: 100 }),
  body('gender').optional().isIn(['male', 'female', 'non-binary', 'other']),
  body('bio').optional().isLength({ max: 500 }),
  validate,
];

module.exports = {
  validate,
  signupValidation,
  loginValidation,
  verifyOtpValidation,
  updateProfileValidation,
};
