const User = require('../models/User');
const { generateToken, generateOnboardingToken } = require('../config/jwt');
const { generateOTP, calculateOTPExpiry } = require('../config/otp');

// @desc    Register new user
// @route   POST /api/auth/signup
// @access  Public
const signup = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, phoneNumber, countryCode } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = calculateOTPExpiry();

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phoneNumber,
      countryCode,
      otp,
      otpExpiry,
      isVerified: false,
    });

    // Generate onboarding token
    const onboardingToken = generateOnboardingToken(user._id);

    // TODO: Send OTP via email or SMS
    console.log(`OTP for ${email}: ${otp}`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please verify OTP.',
      data: {
        userId: user._id,
        email: user.email,
        onboardingToken,
      },
    });
  } catch (error) {
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
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'User already verified',
      });
    }

    // Check OTP
    if (user.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP',
      });
    }

    // Check OTP expiry
    if (user.otpExpiry < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'OTP expired',
      });
    }

    // Update user
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    // Generate tokens
    const token = generateToken(user._id);
    const onboardingToken = generateOnboardingToken(user._id);

    res.json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        token,
        onboardingToken,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phoneNumber: user.phoneNumber,
          countryCode: user.countryCode,

          isVerified: user.isVerified,
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

    const user = await User.findOne({ email }).select('+otp +otpExpiry');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'User already verified',
      });
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpiry = calculateOTPExpiry();

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // TODO: Send OTP via email or SMS
    console.log(`New OTP for ${email}: ${otp}`);

    res.json({
      success: true,
      message: 'OTP sent successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check user exists
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    if (!user.isVerified) {
      // Generate new OTP for unverified users
      const otp = generateOTP();
      const otpExpiry = calculateOTPExpiry();
      
      user.otp = otp;
      user.otpExpiry = otpExpiry;
      await user.save();

      console.log(`OTP for ${email}: ${otp}`);

      return res.status(403).json({
        success: false,
        message: 'Please verify your account. OTP sent to your email.',
        requiresVerification: true,
      });
    }

    // Update last active
    user.lastActive = new Date();
    user.online = true;
    await user.save();

    // Generate tokens
    const token = generateToken(user._id);
    const onboardingToken = user.onboardingCompleted 
      ? null 
      : generateOnboardingToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        ...(onboardingToken && { onboardingToken }),
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          username: user.username,
          onboardingCompleted: user.onboardingCompleted,
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

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  verifyOtp,
  resendOtp,
  login,
  getMe,
};
