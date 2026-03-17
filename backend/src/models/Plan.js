const mongoose = require('mongoose');

const planSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // "free" | "join_me" | "not_free"
    status: {
      type: String,
      enum: ['free', 'join_me', 'not_free'],
      required: true,
    },

    // Short note — e.g. "Coffee in Lekki", "Gym buddy today"
    note: {
      type: String,
      maxlength: 200,
      trim: true,
      required: true,
    },

    // Activity tag (from predefined list)
    activity: {
      type: String,
      maxlength: 60,
      trim: true,
      default: '',
    },

    // Days of the week the user is available
    days: {
      type: [String],
      enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      default: [],
    },

    // Location (optional)
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },   // [lng, lat]
      name: { type: String, default: '' },                 // human-readable
    },

    // Users who accepted / joined this plan
    participants: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        joinedAt: { type: Date, default: Date.now },
      },
    ],

    // When more than 1 participant joins, a group chat can be created
    groupChatId: {
      type: String,
      default: null,
    },

    // Auto-expire — default 6 hours from creation
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 },  // Mongo TTL — auto deletes expired docs
    },

    // Soft active toggle (author can deactivate early)
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// ── Indexes ──────────────────────────────────────────────────────────────────
planSchema.index({ createdAt: -1 });
planSchema.index({ expiresAt: 1 });
planSchema.index({ 'location.coordinates': '2dsphere' });

// ── Virtual: participant count ───────────────────────────────────────────────
planSchema.virtual('participantsCount').get(function () {
  return this.participants?.length ?? 0;
});

planSchema.set('toJSON', { virtuals: true });
planSchema.set('toObject', { virtuals: true });

const Plan = mongoose.model('Plan', planSchema);
module.exports = Plan;
