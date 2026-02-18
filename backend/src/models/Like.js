const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    likedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['like', 'superlike', 'pass'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
likeSchema.index({ user: 1, likedUser: 1 }, { unique: true });
likeSchema.index({ user: 1, type: 1 });
likeSchema.index({ likedUser: 1, type: 1 });

const Like = mongoose.model('Like', likeSchema);

module.exports = Like;
