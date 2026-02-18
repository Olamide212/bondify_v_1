require('dotenv').config();
const mongoose = require('mongoose');
const Lookup = require('../models/Lookup');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

const lookupData = [
  // Interests
  { type: 'interests', value: 'travel', label: 'Travel', category: 'lifestyle', order: 1 },
  { type: 'interests', value: 'photography', label: 'Photography', category: 'creative', order: 2 },
  { type: 'interests', value: 'cooking', label: 'Cooking', category: 'lifestyle', order: 3 },
  { type: 'interests', value: 'fitness', label: 'Fitness', category: 'sports', order: 4 },
  { type: 'interests', value: 'yoga', label: 'Yoga', category: 'sports', order: 5 },
  { type: 'interests', value: 'reading', label: 'Reading', category: 'creative', order: 6 },
  { type: 'interests', value: 'music', label: 'Music', category: 'creative', order: 7 },
  { type: 'interests', value: 'movies', label: 'Movies', category: 'entertainment', order: 8 },
  { type: 'interests', value: 'gaming', label: 'Gaming', category: 'entertainment', order: 9 },
  { type: 'interests', value: 'hiking', label: 'Hiking', category: 'sports', order: 10 },
  { type: 'interests', value: 'dancing', label: 'Dancing', category: 'creative', order: 11 },
  { type: 'interests', value: 'art', label: 'Art', category: 'creative', order: 12 },
  { type: 'interests', value: 'fashion', label: 'Fashion', category: 'lifestyle', order: 13 },
  { type: 'interests', value: 'volunteering', label: 'Volunteering', category: 'lifestyle', order: 14 },
  { type: 'interests', value: 'pets', label: 'Pets', category: 'lifestyle', order: 15 },
  { type: 'interests', value: 'food', label: 'Food', category: 'lifestyle', order: 16 },
  { type: 'interests', value: 'coffee', label: 'Coffee', category: 'lifestyle', order: 17 },
  { type: 'interests', value: 'wine', label: 'Wine', category: 'lifestyle', order: 18 },
  { type: 'interests', value: 'sports', label: 'Sports', category: 'sports', order: 19 },
  { type: 'interests', value: 'writing', label: 'Writing', category: 'creative', order: 20 },

  // Religions
  { type: 'religions', value: 'christian', label: 'Christian', order: 1 },
  { type: 'religions', value: 'muslim', label: 'Muslim', order: 2 },
  { type: 'religions', value: 'hindu', label: 'Hindu', order: 3 },
  { type: 'religions', value: 'buddhist', label: 'Buddhist', order: 4 },
  { type: 'religions', value: 'jewish', label: 'Jewish', order: 5 },
  { type: 'religions', value: 'sikh', label: 'Sikh', order: 6 },
  { type: 'religions', value: 'spiritual', label: 'Spiritual', order: 7 },
  { type: 'religions', value: 'agnostic', label: 'Agnostic', order: 8 },
  { type: 'religions', value: 'atheist', label: 'Atheist', order: 9 },
  { type: 'religions', value: 'other', label: 'Other', order: 10 },

  // Ethnicities
  { type: 'ethnicities', value: 'caucasian', label: 'Caucasian', order: 1 },
  { type: 'ethnicities', value: 'african', label: 'African', order: 2 },
  { type: 'ethnicities', value: 'asian', label: 'Asian', order: 3 },
  { type: 'ethnicities', value: 'hispanic', label: 'Hispanic/Latino', order: 4 },
  { type: 'ethnicities', value: 'middle-eastern', label: 'Middle Eastern', order: 5 },
  { type: 'ethnicities', value: 'native-american', label: 'Native American', order: 6 },
  { type: 'ethnicities', value: 'pacific-islander', label: 'Pacific Islander', order: 7 },
  { type: 'ethnicities', value: 'mixed', label: 'Mixed', order: 8 },
  { type: 'ethnicities', value: 'other', label: 'Other', order: 9 },

  // Languages
  { type: 'languages', value: 'english', label: 'English', order: 1 },
  { type: 'languages', value: 'spanish', label: 'Spanish', order: 2 },
  { type: 'languages', value: 'french', label: 'French', order: 3 },
  { type: 'languages', value: 'german', label: 'German', order: 4 },
  { type: 'languages', value: 'italian', label: 'Italian', order: 5 },
  { type: 'languages', value: 'portuguese', label: 'Portuguese', order: 6 },
  { type: 'languages', value: 'mandarin', label: 'Mandarin', order: 7 },
  { type: 'languages', value: 'arabic', label: 'Arabic', order: 8 },
  { type: 'languages', value: 'hindi', label: 'Hindi', order: 9 },
  { type: 'languages', value: 'japanese', label: 'Japanese', order: 10 },
  { type: 'languages', value: 'korean', label: 'Korean', order: 11 },
  { type: 'languages', value: 'yoruba', label: 'Yoruba', order: 12 },
  { type: 'languages', value: 'igbo', label: 'Igbo', order: 13 },
  { type: 'languages', value: 'hausa', label: 'Hausa', order: 14 },

  // Education
  { type: 'education', value: 'high-school', label: 'High School', order: 1 },
  { type: 'education', value: 'some-college', label: 'Some College', order: 2 },
  { type: 'education', value: 'bachelors', label: "Bachelor's Degree", order: 3 },
  { type: 'education', value: 'masters', label: "Master's Degree", order: 4 },
  { type: 'education', value: 'phd', label: 'PhD/Doctorate', order: 5 },
  { type: 'education', value: 'trade-school', label: 'Trade/Technical School', order: 6 },

  // Zodiac Signs
  { type: 'zodiac', value: 'aries', label: 'Aries', order: 1 },
  { type: 'zodiac', value: 'taurus', label: 'Taurus', order: 2 },
  { type: 'zodiac', value: 'gemini', label: 'Gemini', order: 3 },
  { type: 'zodiac', value: 'cancer', label: 'Cancer', order: 4 },
  { type: 'zodiac', value: 'leo', label: 'Leo', order: 5 },
  { type: 'zodiac', value: 'virgo', label: 'Virgo', order: 6 },
  { type: 'zodiac', value: 'libra', label: 'Libra', order: 7 },
  { type: 'zodiac', value: 'scorpio', label: 'Scorpio', order: 8 },
  { type: 'zodiac', value: 'sagittarius', label: 'Sagittarius', order: 9 },
  { type: 'zodiac', value: 'capricorn', label: 'Capricorn', order: 10 },
  { type: 'zodiac', value: 'aquarius', label: 'Aquarius', order: 11 },
  { type: 'zodiac', value: 'pisces', label: 'Pisces', order: 12 },

  // Personalities
  { type: 'personalities', value: 'adventurous', label: 'Adventurous', order: 1 },
  { type: 'personalities', value: 'ambitious', label: 'Ambitious', order: 2 },
  { type: 'personalities', value: 'creative', label: 'Creative', order: 3 },
  { type: 'personalities', value: 'easygoing', label: 'Easygoing', order: 4 },
  { type: 'personalities', value: 'funny', label: 'Funny', order: 5 },
  { type: 'personalities', value: 'intellectual', label: 'Intellectual', order: 6 },
  { type: 'personalities', value: 'outgoing', label: 'Outgoing', order: 7 },
  { type: 'personalities', value: 'passionate', label: 'Passionate', order: 8 },
  { type: 'personalities', value: 'romantic', label: 'Romantic', order: 9 },
  { type: 'personalities', value: 'spontaneous', label: 'Spontaneous', order: 10 },

  // Family Plans
  { type: 'family-plans', value: 'want-kids', label: 'Want Kids', order: 1 },
  { type: 'family-plans', value: 'have-kids', label: 'Have Kids', order: 2 },
  { type: 'family-plans', value: 'dont-want-kids', label: "Don't Want Kids", order: 3 },
  { type: 'family-plans', value: 'open-to-kids', label: 'Open to Kids', order: 4 },
  { type: 'family-plans', value: 'prefer-not-to-say', label: 'Prefer Not to Say', order: 5 },
];

const seedLookups = async () => {
  try {
    await connectDB();

    // Clear existing lookups
    await Lookup.deleteMany({});
    console.log('Cleared existing lookups');

    // Insert new lookups
    await Lookup.insertMany(lookupData);
    console.log(`Successfully seeded ${lookupData.length} lookup entries`);

    // Log counts by type
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
