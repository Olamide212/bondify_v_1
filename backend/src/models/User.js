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
      enum: ['male', 'female', 'non-binary', 'other'],
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
    zodiacSign: {
      type: String,
    },
    languages: [{
      type: String,
    }],
    drinking: {
      type: String,
      enum: ['never', 'rarely', 'socially', 'regularly', 'prefer-not-to-say'],
    },
    smoking: {
      type: String,
      enum: ['never', 'rarely', 'socially', 'regularly', 'prefer-not-to-say'],
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
      enum: ['have-kids', 'want-kids', 'dont-want-kids', 'open-to-kids', 'prefer-not-to-say'],
    },

    // Relationship Preferences
    lookingFor: {
      type: String,
      enum: ['long-term', 'short-term', 'friendship', 'casual', 'not-sure'],
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

    // Verification & Status
    verified: {
      type: Boolean,
      default: false,
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    premiumExpiresAt: {
      type: Date,
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

    // Privacy Settings
    showDistance: {
      type: Boolean,
      default: true,
    },
    showAge: {
      type: Boolean,
      default: true,
    },
    showOnlineStatus: {
      type: Boolean,
      default: true,
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

    // Account Status
    isActive: {
      type: Boolean,
      default: true,
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

// Indexes
userSchema.index({ location: '2dsphere' });
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ isActive: 1, onboardingCompleted: 1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to calculate completion percentage
userSchema.methods.calculateCompletion = function () {
  const fields = [
    'name', 'age', 'gender', 'bio', 'location.city',
    'occupation', 'education', 'height', 'religion',
    'ethnicity', 'drinking', 'smoking', 'lookingFor', 'images'
  ];
  
  let completed = 0;
  fields.forEach(field => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      if (this[parent] && this[parent][child]) completed++;
    } else if (this[field]) {
      completed++;
    }
  });

  // Additional checks
  if (this.images && this.images.length > 0) completed += 3;
  if (this.interests && this.interests.length >= 3) completed += 2;
  
  this.completionPercentage = Math.round((completed / (fields.length + 5)) * 100);
};

// Virtual for BondScore (compatibility metric)
userSchema.virtual('bondScore').get(function () {
  // Simple calculation based on profile completion and activity
  const base = this.completionPercentage || 0;
  const activityBonus = this.verified ? 10 : 0;
  const interestBonus = Math.min((this.interests?.length || 0) * 2, 10);
  
  return Math.min(base + activityBonus + interestBonus, 100);
});

// Ensure virtuals are included in JSON
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

const User = mongoose.model('User', userSchema);

module.exports = User;
