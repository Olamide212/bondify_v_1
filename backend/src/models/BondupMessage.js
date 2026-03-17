const mongoose = require('mongoose');

/**
 * BondupMessage — a message inside a BondupChat group conversation.
 */
const bondupMessageSchema = new mongoose.Schema(
  {
    bondupChat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BondupChat',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      default: '',
      maxlength: 2000,
    },
    type: {
      type: String,
      enum: ['text', 'image', 'voice', 'gif', 'emoji'],
      default: 'text',
    },
    mediaUrl: {
      type: String,
    },
  },
  { timestamps: true }
);

bondupMessageSchema.index({ bondupChat: 1, createdAt: -1 });
bondupMessageSchema.index({ sender: 1 });

const BondupMessage = mongoose.model('BondupMessage', bondupMessageSchema);
module.exports = BondupMessage;
