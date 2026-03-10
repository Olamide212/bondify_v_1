/**
 * migrateEnums.js
 *
 * One-time script to fix stale kebab-case / old-format enum values
 * stored in existing User documents before the enum refactor.
 *
 * Run once:  node scripts/migrateEnums.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB Connected');
};

// ── Maps: old value → new value ───────────────────────────────────────────────
const MIGRATIONS = {
  exercise: {
    'never':     'Never',
    'rarely':    'Rarely',
    'sometimes': 'Sometimes',
    'often':     'Often',
    'daily':     'Daily',
  },
  pets: {
    'have-pets':       'I have pets',
    'want-pets':       'I want pets',
    'dont-want-pets':  "I don't want pets",
    'allergic':        'Allergic to pets',
    'prefer-not-to-say': 'Prefer not to say',
    // Also fix old title-case variants from previous session
    'I Have pets':     'I have pets',
    'Want pets':       'I want pets',
    "Don't want pets": "I don't want pets",
    'Allergic':        'Allergic to pets',
  },
  communicationStyle: {
    'direct':      'Direct',
    'thoughtful':  'Thoughtful',
    'emotional':   'Emotional',
    'logical':     'Logical',
    'balanced':    'Balanced',
  },
  loveLanguage: {
    'words-of-affirmation': 'Words of Affirmation',
    'quality-time':         'Quality Time',
    'physical-touch':       'Physical Touch',
    'acts-of-service':      'Acts of Service',
    'receiving-gifts':      'Receiving Gifts',
  },
  financialStyle: {
    'spender':          'Spender',
    'saver':            'Saver',
    'investor':         'Investor',
    'balanced':         'Balanced',
    'prefer-not-to-say':'Prefer not to say',
  },
  children: {
    // Old kebab values
    'want-kids':        'I want kids',
    'have-kids':        'I have kids',
    'dont-want-kids':   "I don't want kids",
    'open-to-kids':     'I am open to kids',
    'prefer-not-to-say':'I prefer not to say',
    // Old title-case from previous User.js
    'I Want kids':        'I want kids',
    'I Have kids':        'I have kids',
    "I Don't want kids":  "I don't want kids",
    'I Am open to kids':  'I am open to kids',
    'I Prefer not to say':'I prefer not to say',
    // Seed used slightly different casing
    'I am open to kids':  'I am open to kids',   // already correct — no-op
  },
};

const run = async () => {
  await connectDB();
  const db = mongoose.connection.db;
  const users = db.collection('users');

  let totalUpdated = 0;

  for (const [field, mapping] of Object.entries(MIGRATIONS)) {
    for (const [oldVal, newVal] of Object.entries(mapping)) {
      if (oldVal === newVal) continue; // skip no-ops
      const result = await users.updateMany(
        { [field]: oldVal },
        { $set: { [field]: newVal } }
      );
      if (result.modifiedCount > 0) {
        console.log(`  ${field}: "${oldVal}" → "${newVal}" (${result.modifiedCount} docs)`);
        totalUpdated += result.modifiedCount;
      }
    }
  }

  console.log(`\nMigration complete. Total documents updated: ${totalUpdated}`);
  process.exit(0);
};

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});