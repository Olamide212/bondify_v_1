const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema(
  {
    user1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    user2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'matched', 'unmatched'],
      default: 'pending',
    },
    initiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    matchedAt: {
      type: Date,
    },
    lastMessageAt: {
      type: Date,
    },
    unreadCount: {
      user1: { type: Number, default: 0 },
      user2: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
matchSchema.index({ user1: 1, user2: 1 }, { unique: true });
matchSchema.index({ user1: 1, status: 1 });
matchSchema.index({ user2: 1, status: 1 });

const Match = mongoose.model('Match', matchSchema);

module.exports = Match;
