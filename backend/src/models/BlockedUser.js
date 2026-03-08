const mongoose = require('mongoose');

const blockedUserSchema = new mongoose.Schema(
  {
    blocker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    blocked: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reason: {
      type: String,
      enum: ['harassment', 'spam', 'inappropriate_content', 'fake_profile', 'other'],
      default: 'other',
    },
    notes: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

blockedUserSchema.index({ blocker: 1, blocked: 1 }, { unique: true });
blockedUserSchema.index({ blocker: 1 });
blockedUserSchema.index({ blocked: 1 });

const BlockedUser = mongoose.model('BlockedUser', blockedUserSchema);

module.exports = BlockedUser;
