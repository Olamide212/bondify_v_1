const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    // Who sent the comment
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Who receives it (the profile being viewed)
    toUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Which photo index on the target user's profile
    imageIndex: {
      type: Number,
      required: true,
      default: 0,
    },
    // Snapshot of the image URL at time of comment (so the notification
    // can show a thumbnail even if the user later changes their photos)
    imageUrl: {
      type: String,
      default: null,
    },
    content: {
      type: String,
      required: true,
      maxlength: 300,
      trim: true,
    },
    // Whether the target user has seen / read this comment
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

// Efficient inbox query: all unread comments for a user, newest first
commentSchema.index({ toUser: 1, read: 1, createdAt: -1 });

const Comment = mongoose.model('Comment', commentSchema);
module.exports = Comment;