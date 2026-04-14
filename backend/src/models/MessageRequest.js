const mongoose = require('mongoose');

/**
 * MessageRequest Model
 * 
 * Handles compliment/photo comment requests from unmatched users.
 * Requests expire after 3 days (72 hours) and are auto-deleted via TTL index.
 * 
 * Flow:
 *   1. User A sends compliment/photo comment to User B (not matched)
 *   2. Request is created with status 'pending'
 *   3. User B sees it in their "Requests" tab
 *   4. User B can:
 *      - Accept → Creates a match between both users
 *      - Decline → Marks as declined (or deletes)
 *   5. If not responded within 3 days → Auto-deleted by MongoDB TTL
 */
const messageRequestSchema = new mongoose.Schema(
  {
    // Who initiated the request (sender)
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Who receives the request
    toUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Type of request
    type: {
      type: String,
      enum: ['compliment', 'photo_comment', 'icebreaker'],
      required: true,
      default: 'compliment',
    },

    // Request status
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending',
      index: true,
    },

    // The message/compliment content
    content: {
      type: String,
      required: true,
      maxlength: 500,
      trim: true,
    },

    // For photo comments - which photo index
    imageIndex: {
      type: Number,
      default: 0,
    },

    // Snapshot of the image URL (for photo comments)
    imageUrl: {
      type: String,
      default: null,
    },

    // When the request expires (3 days from creation)
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },

    // When the request was responded to
    respondedAt: {
      type: Date,
    },

    // Match created if accepted
    match: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match',
    },

    // Whether the recipient has seen/read this request
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// ── Compound Indexes ───────────────────────────────────────────────────────────

// Efficient query: all pending requests for a user, newest first
messageRequestSchema.index({ toUser: 1, status: 1, createdAt: -1 });

// Prevent duplicate pending requests from same sender to same receiver
messageRequestSchema.index(
  { fromUser: 1, toUser: 1, status: 1 },
  { 
    unique: true, 
    partialFilterExpression: { status: 'pending' },
    name: 'unique_pending_request'
  }
);

// TTL Index - Auto-delete expired pending requests
// Note: We set expiresAt on creation; MongoDB will delete docs after expiresAt passes
messageRequestSchema.index(
  { expiresAt: 1 },
  { 
    expireAfterSeconds: 0,
    partialFilterExpression: { status: 'pending' },
    name: 'ttl_expired_requests'
  }
);

// ── Virtuals ──────────────────────────────────────────────────────────────────

// Time remaining until expiry (in milliseconds)
messageRequestSchema.virtual('timeRemaining').get(function() {
  if (this.status !== 'pending') return 0;
  const now = new Date();
  const remaining = this.expiresAt.getTime() - now.getTime();
  return Math.max(0, remaining);
});

// Whether the request is expired
messageRequestSchema.virtual('isExpired').get(function() {
  if (this.status !== 'pending') return false;
  return new Date() > this.expiresAt;
});

// Include virtuals when converting to JSON/Object
messageRequestSchema.set('toJSON', { virtuals: true });
messageRequestSchema.set('toObject', { virtuals: true });

// ── Pre-save Hook ─────────────────────────────────────────────────────────────

messageRequestSchema.pre('save', function(next) {
  // Set expiresAt to 3 days from now if not already set
  if (this.isNew && !this.expiresAt) {
    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
    this.expiresAt = new Date(Date.now() + THREE_DAYS_MS);
  }
  next();
});

// ── Static Methods ────────────────────────────────────────────────────────────

/**
 * Get pending requests count for a user
 */
messageRequestSchema.statics.getPendingCount = async function(userId) {
  return this.countDocuments({ toUser: userId, status: 'pending' });
};

/**
 * Check if there's already a pending request between two users
 */
messageRequestSchema.statics.hasPendingRequest = async function(fromUserId, toUserId) {
  const existing = await this.findOne({
    fromUser: fromUserId,
    toUser: toUserId,
    status: 'pending',
  });
  return !!existing;
};

const MessageRequest = mongoose.model('MessageRequest', messageRequestSchema);

module.exports = MessageRequest;
