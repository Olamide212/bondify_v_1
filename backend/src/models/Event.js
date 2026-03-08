const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      maxlength: 1000,
    },
    category: {
      type: String,
      enum: ['dating', 'social', 'sports', 'arts', 'music', 'food', 'travel', 'tech', 'other'],
      default: 'social',
    },
    coverImage: {
      url: String,
      publicId: String,
    },
    date: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
      address: String,
      city: String,
      country: String,
      isOnline: { type: Boolean, default: false },
      onlineLink: String,
    },
    maxAttendees: {
      type: Number,
      default: null, // null = unlimited
    },
    attendees: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        status: {
          type: String,
          enum: ['going', 'interested', 'not_going'],
          default: 'going',
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isPremiumOnly: {
      type: Boolean,
      default: false,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    tags: [String],
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
      default: 'upcoming',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

eventSchema.index({ location: '2dsphere' });
eventSchema.index({ creator: 1 });
eventSchema.index({ date: 1, status: 1 });

eventSchema.virtual('attendeeCount').get(function () {
  return this.attendees ? this.attendees.length : 0;
});

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
