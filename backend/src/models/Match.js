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
    unmatchedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    unmatchReason: {
      type: String,
      enum: ['no_connection', 'lost_interest', 'found_someone', 'inappropriate', 'no_response', 'other'],
    },
    unmatchDetails: {
      type: String,
      maxlength: 500,
    },
    rematchRequestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    rematchRequestedAt: {
      type: Date,
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
