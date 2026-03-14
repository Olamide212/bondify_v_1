const User = require('../models/User');
const { generateToken, generateOnboardingToken } = require('../config/jwt');
const { generateOTP, calculateOTPExpiry } = require('../config/otp');
const { generateReferralCode } = require('../utils/referral');
const { sendOtpEmail, sendWelcomeEmail } = require('../utils/termiiService');
const { sendWelcomeChat } = require('../utils/welcomeChat');

// @desc    Register new user
// @route   POST /api/auth/signup
// @access  Public
const signup = async (req, res, next) => {
  try {
    const {
      firstName, lastName, userName, email,
      password, phoneNumber, countryCode, referralCode,
    } = req.body;

    // 1. Email uniqueness
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // 2. Phone uniqueness (only query if phone was provided)
    const sanitizedPhone = String(phoneNumber || '').replace(/\D/g, '');
    const sanitizedCode  = countryCode
      ? `+${String(countryCode).replace(/\D/g, '')}`
      : null;

    if (sanitizedPhone) {
      const phoneQuery = { phoneNumber: sanitizedPhone };
      if (sanitizedCode) phoneQuery.countryCode = sanitizedCode;

      const phoneExists = await User.findOne(phoneQuery);
      if (phoneExists) {
        return res.status(400).json({
          success: false,
          message: 'An account with this phone number already exists.',
        });
      }
    }

    // 3. Username uniqueness (only query if userName was actually provided)
    // BUG: original code did findOne({ userName: undefined }) when userName
    // was missing from the request body. MongoDB treats that as a query for
    // documents where the field is absent, matching the first user without
    // a userName and falsely returning a 400 "already exists" error.
    if (userName) {
      const userNameExists = await User.findOne({ userName: userName.trim() });
      if (userNameExists) {
        return res.status(400).json({
          success: false,
          message: 'This username is already taken.',
        });
      }
    }

    // 4. Referral
    let referredByUser = null;
    if (referralCode) {
      referredByUser = await User.findOne({ referralCode: referralCode.toUpperCase() });
    }

    // 5. Create user
    const otp       = generateOTP();
    const otpExpiry = calculateOTPExpiry();

    const user = await User.create({
      firstName,
      lastName,
      ...(userName ? { userName: userName.trim() } : {}),
      email,
      password,
      phoneNumber:  sanitizedPhone || undefined,
      countryCode:  sanitizedCode  || undefined,
      otp,
      otpExpiry,
      isVerified: false,
      referredBy: referredByUser?._id,
    });

    user.referralCode = generateReferralCode(user._id.toString());
    await user.save();

    if (referredByUser) {
      await User.findByIdAndUpdate(referredByUser._id, { $inc: { referralCount: 1 } });
    }

    await sendOtpEmail({ email, firstName, otp });

    const onboardingToken = generateOnboardingToken(user._id);

    return res.status(201).json({
      success: true,
      message: 'Account created. Please verify the OTP sent to your email.',
      data: {
        userId: user._id,
        email:  user.email,
        onboardingToken,
      },
    });

  } catch (error) {
    // Catch MongoDB duplicate key race conditions and surface them cleanly
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'field';
      return res.status(400).json({
        success: false,
        message: `An account with this ${field} already exists.`,
      });
    }
    next(error);
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email }).select('+otp +otpExpiry');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'User already verified.' });
    }
    if (user.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    }
    if (user.otpExpiry < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP has expired.' });
    }

    user.isVerified = true;
    user.otp        = undefined;
    user.otpExpiry  = undefined;
    await user.save();

    await sendWelcomeEmail({ email, firstName: user.firstName });

    // Fire-and-forget welcome chat message from Bondies Team
    sendWelcomeChat(user._id);

    const token           = generateToken(user._id);
    const onboardingToken = generateOnboardingToken(user._id);

    return res.json({
      success: true,
      message: 'OTP verified successfully.',
      data: {
        token,
        onboardingToken,
        user: {
          id:                  user._id,
          firstName:           user.firstName,
          lastName:            user.lastName,
          email:               user.email,
          phoneNumber:         user.phoneNumber,
          countryCode:         user.countryCode,
          isVerified:          user.isVerified,
          onboardingCompleted: user.onboardingCompleted,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email }).select('+otp +otpExpiry +firstName');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'User already verified.' });
    }

    const otp       = generateOTP();
    const otpExpiry = calculateOTPExpiry();
    user.otp        = otp;
    user.otpExpiry  = otpExpiry;
    await user.save();

    await sendOtpEmail({ email, firstName: user.firstName, otp });

    return res.json({ success: true, message: 'OTP resent successfully.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { phoneNumber, countryCode, password } = req.body;

    const sanitizedPhone = String(phoneNumber || '').replace(/\D/g, '');
    const sanitizedCode  = countryCode
      ? `+${String(countryCode).replace(/\D/g, '')}`
      : null;

    let user = null;
    if (sanitizedCode) {
      user = await User.findOne({
        phoneNumber: sanitizedPhone,
        countryCode: sanitizedCode,
      }).select('+password');
    }
    if (!user) {
      user = await User.findOne({ phoneNumber: sanitizedPhone }).select('+password');
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    if (!user.isVerified) {
      const otp       = generateOTP();
      const otpExpiry = calculateOTPExpiry();
      user.otp        = otp;
      user.otpExpiry  = otpExpiry;
      await user.save();
      await sendOtpEmail({ email: user.email, firstName: user.firstName, otp });

      return res.status(403).json({
        success: false,
        message: 'Account not verified. OTP sent to your email.',
        requiresVerification: true,
        email: user.email,
      });
    }

    user.lastActive = new Date();
    user.online     = true;
    await user.save();

    const token           = generateToken(user._id);
    const onboardingToken = user.onboardingCompleted
      ? null
      : generateOnboardingToken(user._id);

    return res.json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        ...(onboardingToken && { onboardingToken }),
        user: {
          id:                   user._id,
          email:                user.email,
          firstName:            user.firstName,
          lastName:             user.lastName,
          userName:             user.userName,
          onboardingCompleted:  user.onboardingCompleted,
          completionPercentage: user.completionPercentage,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    return res.json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
};

module.exports = { signup, verifyOtp, resendOtp, login, getMe };