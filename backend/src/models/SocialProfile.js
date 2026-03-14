const mongoose = require('mongoose');

const socialProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    displayName: { type: String, trim: true, maxlength: 60 },
    userName: { type: String, trim: true, lowercase: true, maxlength: 30 },
    profilePhoto: { type: String, default: null }, // S3 URL
    profilePhotoKey: { type: String, default: null }, // S3 object key for deletion
    bio: { type: String, maxlength: 300, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SocialProfile', socialProfileSchema);
