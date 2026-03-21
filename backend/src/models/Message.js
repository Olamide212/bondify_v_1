const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    match: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match',
      required: true,
    },

    // ── Reply threading ────────────────────────────────────────────────────
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },

    // ── Edit tracking ──────────────────────────────────────────────────────
    // Renamed from `edited` → `isEdited` to match controller + frontend
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
    },
    // Full audit trail — each entry records the previous text before an edit
    editHistory: [
      {
        text:     { type: String },
        editedAt: { type: Date },
      },
    ],

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type:     String,
      default:  '',
      maxlength: 2000,
    },
    type: {
      type:    String,
      enum:    ['text', 'image', 'voice', 'gif', 'emoji'],
      default: 'text',
    },
    mediaUrl: {
      type: String,
    },
    mediaDuration: {
      type: Number,
      min:  0,
    },
    read: {
      type:    Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
    delivered: {
      type:    Boolean,
      default: false,
    },
    deliveredAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ────────────────────────────────────────────────────────────────────
messageSchema.index({ match: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ receiver: 1, read: 1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;