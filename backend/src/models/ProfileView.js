const mongoose = require('mongoose');

const profileViewSchema = new mongoose.Schema(
  {
    viewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    viewed: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// One record per viewer→viewed pair; upsert to update timestamp on repeat views
profileViewSchema.index({ viewer: 1, viewed: 1 }, { unique: true });
// Fast lookup: "who viewed me?"
profileViewSchema.index({ viewed: 1, createdAt: -1 });

const ProfileView = mongoose.model('ProfileView', profileViewSchema);

module.exports = ProfileView;
