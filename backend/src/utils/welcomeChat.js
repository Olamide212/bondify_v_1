/**
 * welcomeChat.js
 *
 * Sends an automated welcome message from the "Bondies Team" system account
 * to a newly verified user.  The bot account is created lazily on first use.
 *
 * Flow after OTP verification:
 *   1. Find-or-create the Bondies bot user
 *   2. Create a 'matched' Match between bot ↔ new user
 *   3. Insert the welcome Message into that match
 */

const User    = require('../models/User');
const Match   = require('../models/Match');
const Message = require('../models/Message');
const bcrypt  = require('bcryptjs');

const BOT_EMAIL     = 'bondies-team@bondify.internal';
const BOT_FIRSTNAME = 'Bondies';
const BOT_LASTNAME  = 'Team';

// Use CloudFront CDN if available, otherwise fallback to direct S3
const BOT_AVATAR_KEY = 'system/bondies-team-avatar.png';
const cfDomain = process.env.AWS_CLOUDFRONT_DOMAIN;
const BOT_AVATAR = cfDomain
  ? `${cfDomain.startsWith('http') ? cfDomain.replace(/\/$/, '') : `https://${cfDomain.replace(/\/$/, '')}`}/${BOT_AVATAR_KEY}`
  : `https://bondify-assets.s3.amazonaws.com/${BOT_AVATAR_KEY}`;

const WELCOME_MESSAGES = [
  `Hey there! 👋 Welcome to Bondies — we're so glad you're here.\n\nThis is a safe space to meet genuine people who are looking for real connections. Take your time, fill out your profile, and let's help you find your bond. 💛\n\nIf you ever need help, just reach out — we've got you! 🙌`,
];

/**
 * Returns the Bondies bot User document, creating it on first call.
 */
const getBotUser = async () => {
  let bot = await User.findOne({ email: BOT_EMAIL });
  if (bot) return bot;

  // Create the bot user with a random unguessable password (never used for login)
  const randomPassword = await bcrypt.hash(
    `bot-${Date.now()}-${Math.random().toString(36)}`,
    10
  );

  bot = await User.create({
    firstName:            BOT_FIRSTNAME,
    lastName:             BOT_LASTNAME,
    email:                BOT_EMAIL,
    password:             randomPassword,
    isVerified:           true,
    isSystem:             true,
    isActive:             true,
    onboardingCompleted:  true,
    profilePhoto:         BOT_AVATAR,
    images:               [{ url: BOT_AVATAR, publicId: 'system/bondies-team-avatar', order: 0 }],
    bio:                  'Official Bondify team account 💛',
    // Verified blue badge
    verificationStatus:   'approved',
    verified:             true,
  });

  return bot;
};

/**
 * sendWelcomeChat(newUserId)
 *
 * Called after OTP verification completes for a new user.
 * Errors are swallowed — the welcome message is best-effort and should
 * never block the auth response.
 */
const sendWelcomeChat = async (newUserId) => {
  try {
    const [bot, newUser] = await Promise.all([
      getBotUser(),
      User.findById(newUserId).lean(),
    ]);

    if (!bot || !newUser) return;

    // Only send once — check if a match already exists
    const existing = await Match.findOne({
      $or: [
        { user1: bot._id, user2: newUser._id },
        { user1: newUser._id, user2: bot._id },
      ],
    });
    if (existing) return;

    const now = new Date();

    // 1. Create match (bot is user1, new user is user2)
    const match = await Match.create({
      user1:        bot._id,
      user2:        newUser._id,
      status:       'matched',
      initiatedBy:  bot._id,
      matchedAt:    now,
      lastMessageAt: now,
      unreadCount: { user1: 0, user2: 1 },
    });

    // 2. Send the welcome message
    const content = WELCOME_MESSAGES[0];
    await Message.create({
      match:     match._id,
      sender:    bot._id,
      receiver:  newUser._id,
      content,
      type:      'text',
      read:      false,
      delivered: true,
      deliveredAt: now,
    });
  } catch (err) {
    // Best-effort — log but don't crash the auth flow
    console.error('[welcomeChat] Failed to send welcome message:', err?.message);
  }
};

module.exports = { sendWelcomeChat };
