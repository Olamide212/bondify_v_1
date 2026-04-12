/**
 * CommunicationFeedback Model
 * 
 * Stores individual feedback entries from users about their
 * communication experience with other users.
 */

const mongoose = require('mongoose');

const communicationFeedbackSchema = new mongoose.Schema(
  {
    // Who is giving the feedback
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    
    // Who the feedback is about
    aboutUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    
    // The match/conversation this feedback relates to
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match',
      required: true,
    },
    
    // Feedback type - positive or negative indicators
    feedbackType: {
      type: String,
      enum: [
        // Positive
        'responsive',     // Replies quickly and engages well
        'friendly',       // Pleasant and respectful communication
        'genuine',        // Seems like a real, authentic person
        // Negative
        'slow_to_reply',  // Takes a long time to respond
        'unresponsive',   // Barely replies or ignores messages
        'suspicious',     // May be fake, scammer, or catfish
        'inappropriate',  // Sends inappropriate or offensive content
      ],
      required: true,
    },
    
    // Optional additional context
    comment: {
      type: String,
      maxlength: 500,
      trim: true,
    },
    
    // Number of messages exchanged when feedback was given
    // (helps validate feedback authenticity)
    messagesExchanged: {
      type: Number,
      default: 0,
    },
    
    // Days since match when feedback was given
    daysSinceMatch: {
      type: Number,
      default: 0,
    },
    
    // Weight of this feedback (based on various factors)
    // Higher weight = more impact on score
    weight: {
      type: Number,
      default: 1,
      min: 0.1,
      max: 3,
    },
    
    // Whether this feedback has been processed into the user's score
    processed: {
      type: Boolean,
      default: false,
    },
    
    // For moderation - if feedback was reviewed
    reviewed: {
      type: Boolean,
      default: false,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate feedback for same match
communicationFeedbackSchema.index(
  { fromUser: 1, aboutUser: 1, matchId: 1 },
  { unique: true }
);

// Index for aggregation queries
communicationFeedbackSchema.index({ aboutUser: 1, feedbackType: 1, processed: 1 });

// Static method to calculate weight based on context
communicationFeedbackSchema.statics.calculateWeight = function(feedback) {
  let weight = 1;
  
  // More messages = more reliable feedback
  if (feedback.messagesExchanged > 50) weight += 0.5;
  else if (feedback.messagesExchanged > 20) weight += 0.3;
  else if (feedback.messagesExchanged < 5) weight -= 0.3;
  
  // Longer relationship = more reliable
  if (feedback.daysSinceMatch > 14) weight += 0.3;
  else if (feedback.daysSinceMatch > 7) weight += 0.2;
  
  // Suspicious/inappropriate reports get slightly higher weight for safety
  if (['suspicious', 'inappropriate'].includes(feedback.feedbackType)) {
    weight += 0.2;
  }
  
  return Math.max(0.1, Math.min(3, weight));
};

module.exports = mongoose.model('CommunicationFeedback', communicationFeedbackSchema);
