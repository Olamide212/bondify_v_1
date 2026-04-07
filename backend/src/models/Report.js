const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reported: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reason: {
      type: String,
      enum: [
        'inappropriate_content',
        'harassment',
        'fake_profile',
        'spam',
        'underage',
        'other',
      ],
      default: 'other',
    },
    details: {
      type: String,
      maxlength: 500,
    },
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match',
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

// Prevent duplicate reports from the same user for the same target
reportSchema.index({ reporter: 1, reported: 1 }, { unique: true });
reportSchema.index({ reported: 1 });
reportSchema.index({ status: 1 });

const Report = mongoose.model('Report', reportSchema);
module.exports = Report;
