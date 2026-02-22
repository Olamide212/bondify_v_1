const mongoose = require('mongoose');

const lookupSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: [
        'interests',
        'religions',
        'ethnicities',
        'languages',
        'genders',
        'gender-preferences',
        'relationship-status',
        'looking-for',
        'drinking-habits',
        'smoking-habits',
        'occupations',
        'education',
        'zodiac',
        'personalities',
        'family-plans',
        'nationality',
        'same-beliefs',
        'other',
      ],
    },
    value: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
    category: {
      type: String,
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
lookupSchema.index({ type: 1, isActive: 1 });
lookupSchema.index({ type: 1, value: 1 }, { unique: true });

const Lookup = mongoose.model('Lookup', lookupSchema);

module.exports = Lookup;
