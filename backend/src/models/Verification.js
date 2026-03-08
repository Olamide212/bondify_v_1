const mongoose = require('mongoose');

const verificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    selfieWithIdUrl: {
      url: String,
      publicId: String,
    },
    idType: {
      type: String,
      enum: ['national_id', 'passport', 'drivers_license', 'other'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'under_review', 'approved', 'rejected'],
      default: 'pending',
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedAt: {
      type: Date,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // admin user
    },
    rejectionReason: {
      type: String,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

verificationSchema.index({ user: 1 });
verificationSchema.index({ status: 1 });

const Verification = mongoose.model('Verification', verificationSchema);

module.exports = Verification;
