const mongoose = require('mongoose');

/**
 * PlanChat — a group conversation room tied to a Plan.
 * Created when the plan owner starts the chat.
 */
const planChatSchema = new mongoose.Schema(
  {
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
      required: true,
      unique: true,
    },
    // All members who can participate (author + joined participants)
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    lastMessageAt: {
      type: Date,
      default: null,
    },
    lastMessage: {
      content: { type: String, default: '' },
      sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
  },
  { timestamps: true }
);

planChatSchema.index({ plan: 1 });
planChatSchema.index({ members: 1 });
planChatSchema.index({ lastMessageAt: -1 });

const PlanChat = mongoose.model('PlanChat', planChatSchema);

module.exports = PlanChat;
