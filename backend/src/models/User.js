const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    // Authentication
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    countryCode: {
      type: String,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },

    // Pending email change (waiting for OTP verification)
    pendingEmail: {
      type: String,
      lowercase: true,
      trim: true,
      select: false,
    },

    // OTP Verification
    otp: {
      type: String,
      select: false,
    },
    otpExpiry: {
      type: Date,
      select: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },

    // Onboarding Status
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
    onboardingStep: {
      type: Number,
      default: 0,
    },

    // Basic Information
    age: {
      type: Number,
      min: 18,
      max: 100,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Non-binary', 'Other'],
    },
    bio: {
      type: String,
      maxlength: 500,
    },

    // Location
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
      city: String,
      state: String,
      country: String,
    },
    nationality: {
      type: String,
    },

    // Physical Attributes
    height: {
      type: Number,
    },
    ethnicity: {
      type: String,
    },

    // Professional
    occupation: {
      type: String,
    },
    education: {
      type: String,
    },
    school: {
      type: String,
    },

    // Lifestyle & Preferences
    religion: {
      type: String,
    },
    religionImportance: {
      type: String,
      enum: ['Is very important', 'Is quite important', "It doesn't matter to me at all"],
    },
    zodiacSign: {
      type: String,
    },
    languages: [{
      type: String,
    }],
    drinking: {
      type: String,
      enum: ["No, I don't drink", 'Socially', 'Rarely', 'Regularly', 'Prefer not to say'],
    },
    smoking: {
      type: String,
      enum: ["No, I don't smoke", 'Socially', 'Occasionally', 'Regularly', 'Prefer not to say'],
    },
    exercise: {
      type: String,
      enum: ['never', 'rarely', 'sometimes', 'often', 'daily'],
    },
    pets: {
      type: String,
      enum: ['have-pets', 'want-pets', 'dont-want-pets', 'allergic', 'prefer-not-to-say'],
    },
    children: {
      type: String,
      enum: ['I want kids', 'I have kids', "I don't want kids", 'I am open to kids', 'I prefer not to say'],
    },

    // Relationship Preferences
    lookingFor: {
      type: String,
      enum: ['Long term', 'Something Casual', 'Short term', 'Meet business oriented people', 'I am not sure', 'A Committed relationship'],
    },
    relationshipType: {
      type: String,
    },
    communicationStyle: {
      type: String,
      enum: ['direct', 'thoughtful', 'emotional', 'logical', 'balanced'],
    },
    loveLanguage: {
      type: String,
      enum: ['words-of-affirmation', 'quality-time', 'physical-touch', 'acts-of-service', 'receiving-gifts'],
    },
    financialStyle: {
      type: String,
      enum: ['spender', 'saver', 'investor', 'balanced', 'prefer-not-to-say'],
    },

    // Interests & Personality
    interests: [{
      type: String,
    }],
    personalities: [{
      type: String,
    }],

    // Profile Media
    images: [{
      url: String,
      publicId: String,
      order: Number,
    }],

    // Profile Questions & Answers
    questions: [{
      question: String,
      answer: String,
    }],

    // Voice Prompt
    voicePrompt:    { type: String, default: null }, // S3 public URL
    voicePromptKey: { type: String, default: null }, // S3 object key for deletion

    // Verification & Status
    verified: {
      type: Boolean,
      default: false,
    },
    verificationStatus: {
      type: String,
      enum: ['unverified', 'pending', 'under_review', 'verified', 'rejected'],
      default: 'unverified',
    },

    // Premium
    isPremium: {
      type: Boolean,
      default: false,
    },
    premiumExpiresAt: {
      type: Date,
    },
    premiumPlan: {
      type: String,
      enum: ['basic', 'gold', 'platinum'],
      default: null,
    },
    premiumFeatures: {
      unlimitedLikes:   { type: Boolean, default: false },
      seeWhoLikedYou:   { type: Boolean, default: false },
      superLikes:       { type: Number,  default: 0 },
      boosts:           { type: Number,  default: 0 },
      rewind:           { type: Boolean, default: false },
      incognitoMode:    { type: Boolean, default: false },
      priorityMatching: { type: Boolean, default: false },
    },

    // Profile Completion
    completionPercentage: {
      type: Number,
      default: 0,
    },

    // Activity
    lastActive: {
      type: Date,
      default: Date.now,
    },
    online: {
      type: Boolean,
      default: false,
    },

    // Discovery Preferences
    discoveryPreferences: {
      minAge: {
        type: Number,
        default: 18,
      },
      maxAge: {
        type: Number,
        default: 100,
      },
      maxDistance: {
        type: Number,
        default: 100,
      },
      genderPreference: [{
        type: String,
      }],
    },

    // Stats
    likesGiven: {
      type: Number,
      default: 0,
    },
    likesReceived: {
      type: Number,
      default: 0,
    },
    superLikesGiven: {
      type: Number,
      default: 0,
    },
    superLikesReceived: {
      type: Number,
      default: 0,
    },
    // Incremented (fire-and-forget) each time another user views this profile.
    // Used by GET /api/profile/stats
    profileViews: {
      type: Number,
      default: 0,
    },

    // Notification Settings
    notificationSettings: {
      newMatch:           { type: Boolean, default: true  },
      newMessage:         { type: Boolean, default: true  },
      newLike:            { type: Boolean, default: true  },
      superLike:          { type: Boolean, default: true  },
      eventReminder:      { type: Boolean, default: true  },
      emailNotifications: { type: Boolean, default: true  },
      pushNotifications:  { type: Boolean, default: true  },
      marketingEmails:    { type: Boolean, default: false },
    },

    // Privacy Settings
    privacySettings: {
      profileVisibility: {
        type: String,
        enum: ['everyone', 'matches_only', 'nobody'],
        default: 'everyone',
      },
      showLastActive:             { type: Boolean, default: true  },
      showDistance:               { type: Boolean, default: true  },
      showAge:                    { type: Boolean, default: true  },
      showOnlineStatus:           { type: Boolean, default: true  },
      allowMessageFromNonMatches: { type: Boolean, default: false },
    },

    // Top-level privacy mirrors (kept for legacy queries / middleware)
    showDistance:     { type: Boolean, default: true },
    showAge:          { type: Boolean, default: true },
    showOnlineStatus: { type: Boolean, default: true },

    // Push Token (for push notifications)
    pushToken: {
      type: String,
    },

    // Referral
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    referralCount: {
      type: Number,
      default: 0,
    },

    // Account Status
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deactivatedAt: {
      type: Date,
    },
    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
userSchema.index({ location: '2dsphere' });
userSchema.index({ email: 1 });
userSchema.index({ phoneNumber: 1 });
userSchema.index({ isActive: 1, onboardingCompleted: 1 });
userSchema.index({ referralCode: 1 });

// ── Hooks ─────────────────────────────────────────────────────────────────────

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Instance methods ──────────────────────────────────────────────────────────

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.calculateCompletion = function () {
  const fields = [
    'firstName', 'age', 'gender', 'bio', 'location.city',
    'occupation', 'education', 'height', 'religion',
    'ethnicity', 'drinking', 'smoking', 'lookingFor', 'images',
  ];

  let completed = 0;
  fields.forEach((field) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      if (this[parent]?.[child]) completed++;
    } else if (this[field]) {
      completed++;
    }
  });

  // Bonus points for richer profiles
  if (Array.isArray(this.images)     && this.images.length >= 1)    completed += 3;
  if (Array.isArray(this.interests)  && this.interests.length >= 3)  completed += 2;

  this.completionPercentage = Math.round((completed / (fields.length + 5)) * 100);
};

// ── Virtuals ──────────────────────────────────────────────────────────────────

// BondScore — overall compatibility metric displayed on profiles
userSchema.virtual('bondScore').get(function () {
  const base          = this.completionPercentage || 0;
  const activityBonus = this.verified ? 10 : 0;
  const interestBonus = Math.min((this.interests?.length || 0) * 2, 10);
  return Math.min(base + activityBonus + interestBonus, 100);
});

userSchema.set('toJSON',   { virtuals: true });
userSchema.set('toObject', { virtuals: true });

const User = mongoose.model('User', userSchema);

module.exports = User;