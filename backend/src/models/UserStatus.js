/**
 * UserStatus.js
 *
 * Short-lived status posts that appear as bubbles on the map view.
 * - Text or image (or both)
 * - Expires after 24 h by default
 * - Image is flagged if nudity is detected
 * - TTL index auto-deletes expired documents
 */

const mongoose = require('mongoose');

const userStatusSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Content
    text: {
      type: String,
      maxlength: 280,
      trim: true,
    },
    imageUrl: {
      type: String, // Cloudinary / S3 URL
    },
    imagePublicId: {
      type: String, // for deletion
    },

    // Moderation
    nudityFlagged: {
      type: Boolean,
      default: false,
    },
    moderationScore: {
      type: Number, // 0-1 confidence from AI check
    },
    isVisible: {
      type: Boolean,
      default: true, // flipped to false when flagged
    },

    // Location snapshot at time of post
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [lng, lat]
        required: true,
      },
    },

    // Reactions: { userId: 'heart' | 'fire' | 'laugh' }
    reactions: {
      type: Map,
      of: String,
      default: {},
    },

    // TTL — document deleted automatically after expiresAt
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 h
    },
  },
  { timestamps: true }
);

// Geospatial index
userStatusSchema.index({ location: '2dsphere' });

// MongoDB TTL index — auto-deletes expired statuses
userStatusSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('UserStatus', userStatusSchema);