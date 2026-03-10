const mongoose = require('mongoose');

const lookupSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: [
        // Original types
        'genders',
        'gender-preferences',
        'family-plans',
        'drinking-habits',
        'smoking-habits',
        'relationship-status',
        'looking-for',
        'same-beliefs',
        'interests',
        'religions',
        'ethnicities',
        'languages',
        'education',
        'zodiac',
        'personalities',
        'occupations',
        'nationality',
        // Added in Session 6 — required for MyInfo DB-driven options
        'exercise-habits',
        'pets',
        'communication-style',
        'love-language',
        'financial-style',
      ],
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    value: {
      type: String,
      required: true,
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index so GET /api/lookup/:type is fast
lookupSchema.index({ type: 1, order: 1 });
lookupSchema.index({ type: 1, isActive: 1 });

const Lookup = mongoose.model('Lookup', lookupSchema);

module.exports = Lookup;