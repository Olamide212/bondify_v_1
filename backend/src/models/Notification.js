const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    type: {
      type: String,
      enum: [
        'new_match',
        'new_message',
        'new_like',
        'super_like',
        'photo_like',
        'photo_comment',
        'profile_visit',
        'event_invite',
        'event_reminder',
        'premium_expiry',
        'verification_approved',
        'verification_rejected',
        'referral_joined',
        'ai_tip',
        'profile_incomplete',
        'system',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed, // extra payload (matchId, eventId, etc.)
    },
    read: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
    // Optional fields for rich notifications
    imageUrl: {
      type: String,
    },
    actionUrl: {
      type: String,
    },
    actionLabel: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
