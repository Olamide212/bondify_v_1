const mongoose = require('mongoose');

/**
 * BondupChat — a chat room created when someone joins a Bondup.
 * Type is set based on participant count:
 *   bondup_single  = 2 participants (creator + 1 joiner)
 *   bondup_group   = 3+ participants
 */
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

const BondupChat = mongoose.model('BondupChat', bondupChatSchema);
module.exports = BondupChat;
