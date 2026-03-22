require('dotenv').config();
const mongoose = require('mongoose');
const Lookup = require('../models/Lookup');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

const lookupData = [
  // Genders
  { type: 'genders', value: 'Male',       label: 'Male',       order: 1 },
  { type: 'genders', value: 'Female',     label: 'Female',     order: 2 },
  { type: 'genders', value: 'Non-binary', label: 'Non-binary', order: 3 },
  { type: 'genders', value: 'Other',      label: 'Other',      order: 4 },

  // Gender preferences — align stored value with actual user gender strings
  { type: 'gender-preferences', value: 'Female',   label: 'Women',    description: 'Interested in women',    order: 1 },
  { type: 'gender-preferences', value: 'Male',     label: 'Men',      description: 'Interested in men',      order: 2 },
  { type: 'gender-preferences', value: 'Everyone', label: 'Everyone', description: 'Open to all genders',    order: 3 },

  // Relationship status
  { type: 'relationship-status', value: 'Never married', label: 'Never married', description: 'Looking to meet someone new',     order: 1 },
  { type: 'relationship-status', value: 'Divorced',      label: 'Divorced',      description: 'Divorced or widowed',        order: 2 },
  { type: 'relationship-status', value: 'Separated',     label: 'Separated',     description: 'In a complex situation',     order: 3 },
  { type: 'relationship-status', value: 'Annulled',      label: 'Annulled',      description: 'Marriage was annulled',     order: 4 },
  { type: 'relationship-status', value: 'Widowed',       label: 'Widowed',       description: 'No longer married',         order: 5 },

  // Looking for
  { type: 'looking-for', value: 'Long term relationship',          label: 'Long term relationship',          description: 'Looking for something serious and committed', order: 1 },
  { type: 'looking-for', value: 'Something Casual',                label: 'Something Casual',                description: 'Keep it light and see where it goes',      order: 2 },
  // { type: 'looking-for', value: 'Short term relationship',         label: 'Short term relationship',         description: 'A relationship with defined timeframe',    order: 3 },
  // { type: 'looking-for', value: 'Meet business oriented people',   label: 'Meet business oriented people',   description: 'Connect with like-minded professionals',  order: 4 },
  // { type: 'looking-for', value: 'I am not sure',                   label: 'I am not sure',                   description: 'Still figuring out what I want',         order: 5 },
  { type: 'looking-for', value: 'A Committed relationship',        label: 'A Committed relationship',        description: 'Looking for commitment',                   order: 6 },
  { type: 'looking-for', value: 'Marriage Focused',                        label: 'Marriage Focused',                        description: 'Looking to get married',                  order: 7 },
  { type: 'looking-for', value: 'Friendship',                      label: 'Friendship',                      description: 'Interested in meaningful connections',    order: 8 },
  { type: 'looking-for', value: 'Activity partner',                label: 'Activity partner',                description: 'Find someone to enjoy activities with',   order: 9 },
  { type: 'looking-for', value: 'Just here for fun',               label: 'Just here for fun',               description: 'Have fun and enjoy the experience',      order: 10 },
  { type: 'looking-for', value: 'Other',                           label: 'Other',                           description: 'Something else not listed',              order: 11 },

  // Drinking habits
  { type: 'drinking-habits', value: "No, I don't drink",   label: "No, I don't drink",   description: "Don't drink alcohol",         order: 1 },
  { type: 'drinking-habits', value: 'Socially',            label: 'Socially',            description: 'Only drink at social events', order: 2 },
  { type: 'drinking-habits', value: 'Rarely',              label: 'Rarely',              description: 'Drink a few times a year',   order: 3 },
  { type: 'drinking-habits', value: 'Regularly',           label: 'Regularly',           description: 'Drink several times a month',order: 4 },
  { type: 'drinking-habits', value: 'Prefer not to say',   label: 'Prefer not to say',   description: 'Keep this private',         order: 5 },

  // Smoking habits
  { type: 'smoking-habits', value: "No, I don't smoke", label: "No, I don't smoke", description: "Don't smoke",                        order: 1 },
  { type: 'smoking-habits', value: 'Socially',          label: 'Socially',          description: 'Smoke a few times a month',        order: 2 },
  { type: 'smoking-habits', value: 'Occasionally',      label: 'Occasionally',      description: 'Smoke a few times a month',        order: 3 },
  { type: 'smoking-habits', value: 'Regularly',         label: 'Regularly',         description: 'Smoke several times a week/daily', order: 4 },
  { type: 'smoking-habits', value: 'Prefer not to say', label: 'Prefer not to say', description: 'Keep this private',               order: 5 },

  // ── NEW: Exercise habits ──────────────────────────────────────────────────
  { type: 'exercise-habits', value: 'Never',     label: 'Never',     order: 1 },
  { type: 'exercise-habits', value: 'Rarely',    label: 'Rarely',    order: 2 },
  { type: 'exercise-habits', value: 'Sometimes', label: 'Sometimes', order: 3 },
  { type: 'exercise-habits', value: 'Often',     label: 'Often',     order: 4 },
  { type: 'exercise-habits', value: 'Daily',     label: 'Daily',     order: 5 },

  // ── NEW: Pets preference ─────────────────────────────────────────────────
  { type: 'pets',  value: 'I have pets',       label: 'I have pets',       order: 1 },
  { type: 'pets',  value: 'I want pets',        label: 'I want pets',       order: 2 },
  { type: 'pets',  value: "I don't want pets",  label: "I don't want pets", order: 3 },
  { type: 'pets',  value: 'Allergic to pets',   label: 'Allergic to pets',  order: 4 },
  { type: 'pets',  value: 'Prefer not to say',  label: 'Prefer not to say', order: 5 },

  // ── NEW: Communication style ─────────────────────────────────────────────
  { type: 'communication-style', value: 'Direct',      label: 'Direct',      order: 1 },
  { type: 'communication-style', value: 'Thoughtful',  label: 'Thoughtful',  order: 2 },
  { type: 'communication-style', value: 'Emotional',   label: 'Emotional',   order: 3 },
  { type: 'communication-style', value: 'Logical',     label: 'Logical',     order: 4 },
  { type: 'communication-style', value: 'Balanced',    label: 'Balanced',    order: 5 },

  // ── NEW: Love language ───────────────────────────────────────────────────
  { type: 'love-language', value: 'Words of Affirmation', label: 'Words of Affirmation', order: 1 },
  { type: 'love-language', value: 'Quality Time',         label: 'Quality Time',         order: 2 },
  { type: 'love-language', value: 'Physical Touch',       label: 'Physical Touch',       order: 3 },
  { type: 'love-language', value: 'Acts of Service',      label: 'Acts of Service',      order: 4 },
  { type: 'love-language', value: 'Receiving Gifts',      label: 'Receiving Gifts',      order: 5 },

  // ── NEW: Financial style ─────────────────────────────────────────────────
  { type: 'financial-style', value: 'Spender',          label: 'Spender',          order: 1 },
  { type: 'financial-style', value: 'Saver',            label: 'Saver',            order: 2 },
  { type: 'financial-style', value: 'Investor',         label: 'Investor',         order: 3 },
  { type: 'financial-style', value: 'Balanced',         label: 'Balanced',         order: 4 },
  { type: 'financial-style', value: 'Prefer not to say',label: 'Prefer not to say',order: 5 },

  // Occupations
  { type: 'occupations', value: 'Software Developer', label: 'Software Developer', order: 1 },
  { type: 'occupations', value: 'Graphic Designer',   label: 'Graphic Designer',   order: 2 },
  { type: 'occupations', value: 'Teacher',            label: 'Teacher',            order: 3 },
  { type: 'occupations', value: 'Doctor',             label: 'Doctor',             order: 4 },
  { type: 'occupations', value: 'Engineer',           label: 'Engineer',           order: 5 },
  { type: 'occupations', value: 'Lawyer',             label: 'Lawyer',             order: 6 },
  { type: 'occupations', value: 'Nurse',              label: 'Nurse',              order: 7 },
  { type: 'occupations', value: 'Writer',             label: 'Writer',             order: 8 },
  { type: 'occupations', value: 'Entrepreneur',       label: 'Entrepreneur',       order: 9 },
  { type: 'occupations', value: 'Photographer',       label: 'Photographer',       order: 10 },
  { type: 'occupations', value: 'Musician',           label: 'Musician',           order: 11 },
  { type: 'occupations', value: 'Student',            label: 'Student',            order: 12 },
  { type: 'occupations', value: 'Fashion Designer',   label: 'Fashion Designer',   order: 13 },
  { type: 'occupations', value: 'Model',              label: 'Model',              order: 14 },
  { type: 'occupations', value: 'Makeup Artist',      label: 'Makeup Artist',      order: 15 },
  { type: 'occupations', value: 'Hair Stylist',       label: 'Hair Stylist',       order: 16 },
  { type: 'occupations', value: 'Content Creator',    label: 'Content Creator',    order: 17 },
  { type: 'occupations', value: 'Streamer',           label: 'Streamer',           order: 18 },
  { type: 'occupations', value: 'Architect',          label: 'Architect',          order: 19 },
  { type: 'occupations', value: 'Scientist',          label: 'Scientist',          order: 20 },
  { type: 'occupations', value: 'Artist',             label: 'Artist',             order: 21 },
  { type: 'occupations', value: 'Chef',               label: 'Chef',               order: 22 },
  { type: 'occupations', value: 'Dancer',             label: 'Dancer',             order: 23 },
  { type: 'occupations', value: 'Actor',              label: 'Actor',              order: 24 },
  { type: 'occupations', value: 'Music Producer',     label: 'Music Producer',     order: 25 },
  { type: 'occupations', value: 'DJ',                 label: 'DJ',                 order: 26 },
  { type: 'occupations', value: 'Event Planner',      label: 'Event Planner',      order: 27 },
  { type: 'occupations', value: 'Interior Designer',  label: 'Interior Designer',  order: 28 },
  { type: 'occupations', value: 'Other',              label: 'Other',              order: 29 },

  // Interests
  { type: 'interests', value: 'Travel',       label: 'Travel',       category: 'lifestyle',     order: 1  },
  { type: 'interests', value: 'Photography',  label: 'Photography',  category: 'creative',      order: 2  },
  { type: 'interests', value: 'Cooking',      label: 'Cooking',      category: 'lifestyle',     order: 3  },
  { type: 'interests', value: 'Fitness',      label: 'Fitness',      category: 'sports',        order: 4  },
  { type: 'interests', value: 'Yoga',         label: 'Yoga',         category: 'sports',        order: 5  },
  { type: 'interests', value: 'Reading',      label: 'Reading',      category: 'creative',      order: 6  },
  { type: 'interests', value: 'Music',        label: 'Music',        category: 'creative',      order: 7  },
  { type: 'interests', value: 'Movies',       label: 'Movies',       category: 'entertainment', order: 8  },
  { type: 'interests', value: 'Gaming',       label: 'Gaming',       category: 'entertainment', order: 9  },
  { type: 'interests', value: 'Hiking',       label: 'Hiking',       category: 'sports',        order: 10 },
  { type: 'interests', value: 'Dancing',      label: 'Dancing',      category: 'creative',      order: 11 },
  { type: 'interests', value: 'Art',          label: 'Art',          category: 'creative',      order: 12 },
  { type: 'interests', value: 'Fashion',      label: 'Fashion',      category: 'lifestyle',     order: 13 },
  { type: 'interests', value: 'Volunteering', label: 'Volunteering', category: 'lifestyle',     order: 14 },
  { type: 'interests', value: 'Pets',         label: 'Pets',         category: 'lifestyle',     order: 15 },
  { type: 'interests', value: 'Food',         label: 'Food',         category: 'lifestyle',     order: 16 },
  { type: 'interests', value: 'Coffee',       label: 'Coffee',       category: 'lifestyle',     order: 17 },
  { type: 'interests', value: 'Wine',         label: 'Wine',         category: 'lifestyle',     order: 18 },
  { type: 'interests', value: 'Sports',       label: 'Sports',       category: 'sports',        order: 19 },
  { type: 'interests', value: 'Writing',      label: 'Writing',      category: 'creative',      order: 20 },

  // Religions
  { type: 'religions', value: 'Christian', label: 'Christian', order: 1 },
  { type: 'religions', value: 'Muslim',    label: 'Muslim',    order: 2 },
  { type: 'religions', value: 'Hindu',     label: 'Hindu',     order: 3 },
  { type: 'religions', value: 'Buddhist',  label: 'Buddhist',  order: 4 },
  { type: 'religions', value: 'Jewish',    label: 'Jewish',    order: 5 },
  { type: 'religions', value: 'Sikh',      label: 'Sikh',      order: 6 },
  { type: 'religions', value: 'Spiritual', label: 'Spiritual', order: 7 },
  { type: 'religions', value: 'Agnostic',  label: 'Agnostic',  order: 8 },
  { type: 'religions', value: 'Atheist',   label: 'Atheist',   order: 9 },
  { type: 'religions', value: 'Other',     label: 'Other',     order: 10 },

  // Ethnicities
  { type: 'ethnicities', value: 'Caucasian',        label: 'Caucasian',        order: 1 },
  { type: 'ethnicities', value: 'African',          label: 'African',          order: 2 },
  { type: 'ethnicities', value: 'Asian',            label: 'Asian',            order: 3 },
  { type: 'ethnicities', value: 'Hispanic/Latino',  label: 'Hispanic/Latino',  order: 4 },
  { type: 'ethnicities', value: 'Middle Eastern',   label: 'Middle Eastern',   order: 5 },
  { type: 'ethnicities', value: 'Native American',  label: 'Native American',  order: 6 },
  { type: 'ethnicities', value: 'Pacific Islander', label: 'Pacific Islander', order: 7 },
  { type: 'ethnicities', value: 'Mixed',            label: 'Mixed',            order: 8 },
  { type: 'ethnicities', value: 'Other',            label: 'Other',            order: 9 },

  // Languages
  { type: 'languages', value: 'English',    label: 'English',    order: 1  },
  { type: 'languages', value: 'Spanish',    label: 'Spanish',    order: 2  },
  { type: 'languages', value: 'French',     label: 'French',     order: 3  },
  { type: 'languages', value: 'German',     label: 'German',     order: 4  },
  { type: 'languages', value: 'Italian',    label: 'Italian',    order: 5  },
  { type: 'languages', value: 'Portuguese', label: 'Portuguese', order: 6  },
  { type: 'languages', value: 'Mandarin',   label: 'Mandarin',   order: 7  },
  { type: 'languages', value: 'Arabic',     label: 'Arabic',     order: 8  },
  { type: 'languages', value: 'Hindi',      label: 'Hindi',      order: 9  },
  { type: 'languages', value: 'Japanese',   label: 'Japanese',   order: 10 },
  { type: 'languages', value: 'Korean',     label: 'Korean',     order: 11 },
  { type: 'languages', value: 'Yoruba',     label: 'Yoruba',     order: 12 },
  { type: 'languages', value: 'Igbo',       label: 'Igbo',       order: 13 },
  { type: 'languages', value: 'Hausa',      label: 'Hausa',      order: 14 },

  // Education
  { type: 'education', value: 'High school',           label: 'High school',           order: 1 },
  { type: 'education', value: 'Some college',          label: 'Some college',          order: 2 },
  { type: 'education', value: 'Bachelors Degree',      label: 'Bachelors Degree',      order: 3 },
  { type: 'education', value: 'Masters Degree',        label: 'Masters Degree',        order: 4 },
  { type: 'education', value: 'PhD/Doctorate',         label: 'PhD/Doctorate',         order: 5 },
  { type: 'education', value: 'Trade/Technical School',label: 'Trade/Technical School',order: 6 },

  // Zodiac Signs
  { type: 'zodiac', value: 'Aries',       label: 'Aries',       order: 1  },
  { type: 'zodiac', value: 'Taurus',      label: 'Taurus',      order: 2  },
  { type: 'zodiac', value: 'Gemini',      label: 'Gemini',      order: 3  },
  { type: 'zodiac', value: 'Cancer',      label: 'Cancer',      order: 4  },
  { type: 'zodiac', value: 'Leo',         label: 'Leo',         order: 5  },
  { type: 'zodiac', value: 'Virgo',       label: 'Virgo',       order: 6  },
  { type: 'zodiac', value: 'Libra',       label: 'Libra',       order: 7  },
  { type: 'zodiac', value: 'Scorpio',     label: 'Scorpio',     order: 8  },
  { type: 'zodiac', value: 'Sagittarius', label: 'Sagittarius', order: 9  },
  { type: 'zodiac', value: 'Capricorn',   label: 'Capricorn',   order: 10 },
  { type: 'zodiac', value: 'Aquarius',    label: 'Aquarius',    order: 11 },
  { type: 'zodiac', value: 'Pisces',      label: 'Pisces',      order: 12 },

  // Personalities
  { type: 'personalities', value: 'Adventurous',  label: 'Adventurous',  order: 1  },
  { type: 'personalities', value: 'Ambitious',    label: 'Ambitious',    order: 2  },
  { type: 'personalities', value: 'Creative',     label: 'Creative',     order: 3  },
  { type: 'personalities', value: 'Easygoing',    label: 'Easygoing',    order: 4  },
  { type: 'personalities', value: 'Funny',        label: 'Funny',        order: 5  },
  { type: 'personalities', value: 'Intellectual', label: 'Intellectual', order: 6  },
  { type: 'personalities', value: 'Outgoing',     label: 'Outgoing',     order: 7  },
  { type: 'personalities', value: 'Passionate',   label: 'Passionate',   order: 8  },
  { type: 'personalities', value: 'Romantic',     label: 'Romantic',     order: 9  },
  { type: 'personalities', value: 'Spontaneous',  label: 'Spontaneous',  order: 10 },

  // Family Plans (children)
  { type: 'family-plans', value: 'I want kids',         label: 'I want kids',         order: 1 },
  { type: 'family-plans', value: 'I have kids',         label: 'I have kids',         order: 2 },
  { type: 'family-plans', value: "I don't want kids",   label: "I don't want kids",   order: 3 },
  { type: 'family-plans', value: 'I am open to kids',   label: 'I am open to kids',   order: 4 },
  { type: 'family-plans', value: 'I prefer not to say', label: 'I prefer not to say', order: 5 },

  // Same beliefs
  { type: 'same-beliefs', value: 'Is very important',              label: 'Is very important',              order: 1 },
  { type: 'same-beliefs', value: 'Is quite important',             label: 'Is quite important',             order: 2 },
  { type: 'same-beliefs', value: "It doesn't matter to me at all", label: "It doesn't matter to me at all", order: 3 },

  // ── NEW: Religion Practice ───────────────────────────────────────────────
  {
    type: 'religion-practice',
    value: 'Very religious',
    label: 'Very religious',
    description: 'Faith is central to my life',
    order: 1,
  },
  {
    type: 'religion-practice',
    value: 'Moderately religious',
    label: 'Moderately religious',
    description: 'I practice my faith regularly',
    order: 2,
  },
  {
    type: 'religion-practice',
    value: 'Spiritual but not religious',
    label: 'Spiritual but not religious',
    description: "I'm spiritual but don't follow organized religion",
    order: 3,
  },
  {
    type: 'religion-practice',
    value: 'Occasionally religious',
    label: 'Occasionally religious',
    description: 'I practice occasionally, not regularly',
    order: 4,
  },
  {
    type: 'religion-practice',
    value: 'Non-religious',
    label: 'Non-religious',
    description: 'Religion is not part of my life',
    order: 5,
  },
  {
    type: 'religion-practice',
    value: 'Prefer not to say',
    label: 'Prefer not to say',
    description: 'Keep this private',
    order: 6,
  },

  // ── NEW: Relocation Preference ───────────────────────────────────────────
  {
    type: 'relocation-preference',
    value: 'Yes, definitely',
    label: 'Yes, definitely',
    description: "I'm open to moving for the right person",
    order: 1,
  },
  {
    type: 'relocation-preference',
    value: 'Maybe',
    label: 'Maybe',
    description: 'I\'d consider it depending on circumstances',
    order: 2,
  },
  {
    type: 'relocation-preference',
    value: 'Probably not',
    label: 'Probably not',
    description: "I'm unlikely to move but haven't ruled it out",
    order: 3,
  },
  {
    type: 'relocation-preference',
    value: 'No',
    label: 'No',
    description: 'My location is important, I won\'t relocate',
    order: 4,
  },
  {
    type: 'relocation-preference',
    value: 'Prefer not to say',
    label: 'Prefer not to say',
    description: 'Keep this private',
    order: 5,
  },

  // ── NEW: Blood Group ─────────────────────────────────────────────────────
  { type: 'blood-group', value: 'O+', label: 'O+', order: 1 },
  { type: 'blood-group', value: 'O-', label: 'O-', order: 2 },
  { type: 'blood-group', value: 'A+', label: 'A+', order: 3 },
  { type: 'blood-group', value: 'A-', label: 'A-', order: 4 },
  { type: 'blood-group', value: 'B+', label: 'B+', order: 5 },
  { type: 'blood-group', value: 'B-', label: 'B-', order: 6 },
  { type: 'blood-group', value: 'AB+', label: 'AB+', order: 7 },
  { type: 'blood-group', value: 'AB-', label: 'AB-', order: 8 },
  { type: 'blood-group', value: 'Prefer not to say', label: 'Prefer not to say', order: 9 },

  // ── NEW: Genotype ───────────────────────────────────────────────────────
  { type: 'genotype', value: 'AA', label: 'AA', order: 1 },
  { type: 'genotype', value: 'AS', label: 'AS', order: 2 },
  { type: 'genotype', value: 'SS', label: 'SS', order: 3 },
  { type: 'genotype', value: 'AC', label: 'AC', order: 4 },
  { type: 'genotype', value: 'SC', label: 'SC', order: 5 },
  { type: 'genotype', value: 'CC', label: 'CC', order: 6 },
  { type: 'genotype', value: 'Unknown', label: 'Unknown', order: 7 },
  { type: 'genotype', value: 'Prefer not to say', label: 'Prefer not to say', order: 8 },

  // ── NEW: Favorite Music ──────────────────────────────────────────────────
  { type: 'favorite-music', value: 'Pop',           label: 'Pop',           order: 1 },
  { type: 'favorite-music', value: 'Rock',          label: 'Rock',          order: 2 },
  { type: 'favorite-music', value: 'Jazz',          label: 'Jazz',          order: 3 },
  { type: 'favorite-music', value: 'Classical',     label: 'Classical',     order: 4 },
  { type: 'favorite-music', value: 'Hip Hop',       label: 'Hip Hop',       order: 5 },
  { type: 'favorite-music', value: 'Electronic',    label: 'Electronic',    order: 6 },
  { type: 'favorite-music', value: 'Country',       label: 'Country',       order: 7 },
  { type: 'favorite-music', value: 'R&B',           label: 'R&B',           order: 8 },
  { type: 'favorite-music', value: 'Reggae',        label: 'Reggae',        order: 9 },
  { type: 'favorite-music', value: 'Blues',         label: 'Blues',         order: 10 },
  { type: 'favorite-music', value: 'Folk',          label: 'Folk',          order: 11 },
  { type: 'favorite-music', value: 'Indie',         label: 'Indie',         order: 12 },
  { type: 'favorite-music', value: 'Alternative',   label: 'Alternative',   order: 13 },
  { type: 'favorite-music', value: 'Metal',         label: 'Metal',         order: 14 },
  { type: 'favorite-music', value: 'Punk',          label: 'Punk',          order: 15 },
  { type: 'favorite-music', value: 'Soul',          label: 'Soul',          order: 16 },
  { type: 'favorite-music', value: 'Funk',          label: 'Funk',          order: 17 },
  { type: 'favorite-music', value: 'Disco',         label: 'Disco',         order: 18 },
  { type: 'favorite-music', value: 'Gospel',        label: 'Gospel',        order: 19 },
  { type: 'favorite-music', value: 'World Music',   label: 'World Music',   order: 20 },

  // ── NEW: Favorite Videos ─────────────────────────────────────────────────
  { type: 'favorite-videos', value: 'Documentaries',     label: 'Documentaries',     order: 1 },
  { type: 'favorite-videos', value: 'Comedy Shows',      label: 'Comedy Shows',      order: 2 },
  { type: 'favorite-videos', value: 'Action Movies',     label: 'Action Movies',     order: 3 },
  { type: 'favorite-videos', value: 'Reality TV',        label: 'Reality TV',        order: 4 },
  { type: 'favorite-videos', value: 'Anime',             label: 'Anime',             order: 5 },
  { type: 'favorite-videos', value: 'Cooking Shows',     label: 'Cooking Shows',     order: 6 },
  { type: 'favorite-videos', value: 'Travel Vlogs',      label: 'Travel Vlogs',      order: 7 },
  { type: 'favorite-videos', value: 'Music Videos',      label: 'Music Videos',      order: 8 },
  { type: 'favorite-videos', value: 'Drama Series',      label: 'Drama Series',      order: 9 },
  { type: 'favorite-videos', value: 'Horror Movies',     label: 'Horror Movies',     order: 10 },
  { type: 'favorite-videos', value: 'Romance Movies',    label: 'Romance Movies',    order: 11 },
  { type: 'favorite-videos', value: 'Sci-Fi',            label: 'Sci-Fi',            order: 12 },
  { type: 'favorite-videos', value: 'Fantasy',           label: 'Fantasy',           order: 13 },
  { type: 'favorite-videos', value: 'Thrillers',         label: 'Thrillers',         order: 14 },
  { type: 'favorite-videos', value: 'Mystery',           label: 'Mystery',           order: 15 },
  { type: 'favorite-videos', value: 'Stand-up Comedy',   label: 'Stand-up Comedy',   order: 16 },
  { type: 'favorite-videos', value: 'Sports Highlights', label: 'Sports Highlights', order: 17 },
  { type: 'favorite-videos', value: 'News',              label: 'News',              order: 18 },
  { type: 'favorite-videos', value: 'Educational',       label: 'Educational',       order: 19 },
  { type: 'favorite-videos', value: 'Podcasts',          label: 'Podcasts',          order: 20 },

  // ── NEW: Fun Activities ──────────────────────────────────────────────────
  { type: 'fun-activities', value: 'Hiking',         label: 'Hiking',         order: 1 },
  { type: 'fun-activities', value: 'Cooking',        label: 'Cooking',        order: 2 },
  { type: 'fun-activities', value: 'Reading',        label: 'Reading',        order: 3 },
  { type: 'fun-activities', value: 'Gaming',         label: 'Gaming',         order: 4 },
  { type: 'fun-activities', value: 'Photography',    label: 'Photography',    order: 5 },
  { type: 'fun-activities', value: 'Dancing',        label: 'Dancing',        order: 6 },
  { type: 'fun-activities', value: 'Traveling',      label: 'Traveling',      order: 7 },
  { type: 'fun-activities', value: 'Painting',       label: 'Painting',       order: 8 },
  { type: 'fun-activities', value: 'Writing',        label: 'Writing',        order: 9 },
  { type: 'fun-activities', value: 'Yoga',           label: 'Yoga',           order: 10 },
  { type: 'fun-activities', value: 'Fitness',        label: 'Fitness',        order: 11 },
  { type: 'fun-activities', value: 'Music',          label: 'Music',          order: 12 },
  { type: 'fun-activities', value: 'Movies',         label: 'Movies',         order: 13 },
  { type: 'fun-activities', value: 'Sports',         label: 'Sports',         order: 14 },
  { type: 'fun-activities', value: 'Board Games',    label: 'Board Games',    order: 15 },
  { type: 'fun-activities', value: 'Volunteering',   label: 'Volunteering',   order: 16 },
  { type: 'fun-activities', value: 'Gardening',      label: 'Gardening',      order: 17 },
  { type: 'fun-activities', value: 'Shopping',       label: 'Shopping',       order: 18 },
  { type: 'fun-activities', value: 'Concerts',       label: 'Concerts',       order: 19 },
  { type: 'fun-activities', value: 'Beach',          label: 'Beach',          order: 20 },
];

const nationalityData = [
  { key: 'algeria', value: 'Algeria', flag: '🇩🇿' }, { key: 'angola', value: 'Angola', flag: '🇦🇴' },
  { key: 'benin', value: 'Benin', flag: '🇧🇯' }, { key: 'botswana', value: 'Botswana', flag: '🇧🇼' },
  { key: 'burkina-faso', value: 'Burkina Faso', flag: '🇧🇫' }, { key: 'burundi', value: 'Burundi', flag: '🇧🇮' },
  { key: 'cabo-verde', value: 'Cabo Verde', flag: '🇨🇻' }, { key: 'cameroon', value: 'Cameroon', flag: '🇨🇲' },
  { key: 'central-african-republic', value: 'Central African Republic', flag: '🇨🇫' },
  { key: 'chad', value: 'Chad', flag: '🇹🇩' }, { key: 'comoros', value: 'Comoros', flag: '🇰🇲' },
  { key: 'democratic-republic-of-the-congo', value: 'Democratic Republic of the Congo', flag: '🇨🇩' },
  { key: 'republic-of-the-congo', value: 'Republic of the Congo', flag: '🇨🇬' },
  { key: 'cote-d-ivoire', value: "Côte d'Ivoire", flag: '🇨🇮' }, { key: 'djibouti', value: 'Djibouti', flag: '🇩🇯' },
  { key: 'egypt', value: 'Egypt', flag: '🇪🇬' }, { key: 'equatorial-guinea', value: 'Equatorial Guinea', flag: '🇬🇶' },
  { key: 'eritrea', value: 'Eritrea', flag: '🇪🇷' }, { key: 'eswatini', value: 'Eswatini', flag: '🇸🇿' },
  { key: 'ethiopia', value: 'Ethiopia', flag: '🇪🇹' }, { key: 'gabon', value: 'Gabon', flag: '🇬🇦' },
  { key: 'gambia', value: 'Gambia', flag: '🇬🇲' }, { key: 'ghana', value: 'Ghana', flag: '🇬🇭' },
  { key: 'guinea', value: 'Guinea', flag: '🇬🇳' }, { key: 'guinea-bissau', value: 'Guinea-Bissau', flag: '🇬🇼' },
  { key: 'kenya', value: 'Kenya', flag: '🇰🇪' }, { key: 'lesotho', value: 'Lesotho', flag: '🇱🇸' },
  { key: 'liberia', value: 'Liberia', flag: '🇱🇷' }, { key: 'libya', value: 'Libya', flag: '🇱🇾' },
  { key: 'madagascar', value: 'Madagascar', flag: '🇲🇬' }, { key: 'malawi', value: 'Malawi', flag: '🇲🇼' },
  { key: 'mali', value: 'Mali', flag: '🇲🇱' }, { key: 'mauritania', value: 'Mauritania', flag: '🇲🇷' },
  { key: 'mauritius', value: 'Mauritius', flag: '🇲🇺' }, { key: 'morocco', value: 'Morocco', flag: '🇲🇦' },
  { key: 'mozambique', value: 'Mozambique', flag: '🇲🇿' }, { key: 'namibia', value: 'Namibia', flag: '🇳🇦' },
  { key: 'niger', value: 'Niger', flag: '🇳🇪' }, { key: 'nigeria', value: 'Nigeria', flag: '🇳🇬' },
  { key: 'rwanda', value: 'Rwanda', flag: '🇷🇼' },
  { key: 'sao-tome-and-principe', value: 'São Tomé and Príncipe', flag: '🇸🇹' },
  { key: 'senegal', value: 'Senegal', flag: '🇸🇳' }, { key: 'seychelles', value: 'Seychelles', flag: '🇸🇨' },
  { key: 'sierra-leone', value: 'Sierra Leone', flag: '🇸🇱' }, { key: 'somalia', value: 'Somalia', flag: '🇸🇴' },
  { key: 'south-africa', value: 'South Africa', flag: '🇿🇦' }, { key: 'south-sudan', value: 'South Sudan', flag: '🇸🇸' },
  { key: 'sudan', value: 'Sudan', flag: '🇸🇩' }, { key: 'tanzania', value: 'Tanzania', flag: '🇹🇿' },
  { key: 'togo', value: 'Togo', flag: '🇹🇬' }, { key: 'tunisia', value: 'Tunisia', flag: '🇹🇳' },
  { key: 'uganda', value: 'Uganda', flag: '🇺🇬' }, { key: 'zambia', value: 'Zambia', flag: '🇿🇲' },
  { key: 'zimbabwe', value: 'Zimbabwe', flag: '🇿🇼' },
];

const nationalityLookupEntries = nationalityData.map(({ key, value, flag }, index) => ({
  type: 'nationality',
  value: key,
  label: flag ? `${flag} ${value}` : value,
  order: index + 1,
}));

const combinedLookupData = [...lookupData, ...nationalityLookupEntries];

const seedLookups = async () => {
  try {
    await connectDB();
    await Lookup.deleteMany({});
    console.log('Cleared existing lookups');
    await Lookup.insertMany(combinedLookupData);
    console.log(`Successfully seeded ${combinedLookupData.length} lookup entries`);
    const types = await Lookup.distinct('type');
    for (const type of types) {
      const count = await Lookup.countDocuments({ type });
      console.log(`  - ${type}: ${count} entries`);
    }
    process.exit(0);
  } catch (error) {
    console.error('Error seeding lookups:', error);
    process.exit(1);
  }
};

seedLookups();