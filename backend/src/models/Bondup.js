const mongoose = require('mongoose');

/**
 * Bondup — a spontaneous meetup post that others can discover and join.
 * Can be public (city-wide) or private (circle only).
 */
const bondupSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },

    activityType: {
      type: String,
      enum: ['coffee', 'food', 'drinks', 'brunch', 'dinner', 'lunch', 'snacks', 'dessert', 'gym', 'yoga', 'running', 'hiking', 'cycling', 'swimming', 'tennis', 'basketball', 'football', 'volleyball', 'walk', 'park', 'beach', 'picnic', 'camping', 'fishing', 'movie', 'theater', 'concert', 'museum', 'art', 'comedy', 'board_games', 'video_games', 'karaoke', 'dancing', 'party', 'networking', 'workshop', 'class', 'photography', 'painting', 'music', 'other'],
      required: true,
    },

    location: {
      type: String,
      trim: true,
      default: '',
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },

    // ISO timestamp of the planned meetup
    dateTime: {
      type: Date,
      required: true,
    },

    // public = visible to all users in same city
    // circle = visible only to followers/friends
    visibility: {
      type: String,
      enum: ['public', 'circle'],
      default: 'public',
    },

    // Optional cap on how many can join (null = unlimited)
    maxParticipants: {
      type: Number,
      default: null,
      min: 1,
    },

    // Users who joined this Bondup
    participants: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        joinedAt: { type: Date, default: Date.now },
      },
    ],

    // Group/1-on-1 chat created when someone joins
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BondupChat',
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // join_me = creator wants others to join their plan
    // i_am_available = creator is free and open to being invited
    postType: {
      type: String,
      enum: ['join_me', 'i_am_available'],
      default: 'join_me',
    },

    // Auto-expires dateTime + 24 hours (Mongo TTL deletes the document)
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 },
    },
  },
  { timestamps: true }
);

// ── Indexes ──────────────────────────────────────────────────────────────────
bondupSchema.index({ createdAt: -1 });
bondupSchema.index({ city: 1, visibility: 1 });
bondupSchema.index({ dateTime: 1 });
bondupSchema.index({ 'participants.user': 1 });

// ── Virtual: participant count ───────────────────────────────────────────────
bondupSchema.virtual('participantsCount').get(function () {
  return this.participants?.length ?? 0;
});

bondupSchema.set('toJSON', { virtuals: true });
bondupSchema.set('toObject', { virtuals: true });

const Bondup = mongoose.model('Bondup', bondupSchema);
module.exports = Bondup;
