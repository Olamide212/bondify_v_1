const mongoose = require('mongoose');

/**
 * PlanMessage — a message inside a PlanChat group conversation.
 */
const planMessageSchema = new mongoose.Schema(
  {
    planChat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PlanChat',
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

planMessageSchema.index({ planChat: 1, createdAt: -1 });
planMessageSchema.index({ sender: 1 });

const PlanMessage = mongoose.model('PlanMessage', planMessageSchema);

module.exports = PlanMessage;
