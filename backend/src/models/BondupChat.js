const mongoose = require('mongoose');

/**
 * BondupChat — a chat room created when someone joins a Bondup.
 * Type is set based on participant count:
 *   bondup_single  = 2 participants (creator + 1 joiner)
 *   bondup_group   = 3+ participants
 *
 * Match flow (bondup_single only):
 *   PRE_MATCH  → both users can send up to MESSAGE_LIMIT messages each
 *   MATCH_PENDING → one user requested a match; waiting for the other
 *   MATCHED    → both users agreed; unlimited messaging
 */
const MESSAGE_LIMIT = 3;

const bondupChatSchema = new mongoose.Schema(
  {
    bondup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bondup',
      required: true,
      unique: true,
    },

    type: {
      type: String,
      enum: ['bondup_single', 'bondup_group'],
      default: 'bondup_single',
    },

    // All members: creator + participants
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    // ── Match state (bondup_single only) ──────────────────────────────────
    matchStatus: {
      type: String,
      enum: ['none', 'pending', 'matched'],
      default: 'none',
    },

    // Who initiated the match request (only set when matchStatus === 'pending')
    matchInitiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Track how many messages each user has sent (Map<UserId, Number>)
    messageCountPerUser: {
      type: Map,
      of: Number,
      default: {},
    },

    lastMessageAt: {
      type: Date,
      default: null,
    },

    lastMessage: {
      content: { type: String, default: '' },
      sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },

    // Chat auto-expires 24h after Bondup's dateTime
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

bondupChatSchema.index({ bondup: 1 });
bondupChatSchema.index({ members: 1 });
bondupChatSchema.index({ lastMessageAt: -1 });

// Virtual: message limit constant
bondupChatSchema.statics.MESSAGE_LIMIT = MESSAGE_LIMIT;

const BondupChat = mongoose.model('BondupChat', bondupChatSchema);
module.exports = BondupChat;
