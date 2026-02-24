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
  { type: 'genders', value: 'Male', label: 'Male', order: 1 },
  { type: 'genders', value: 'Female', label: 'Female', order: 2 },
  { type: 'genders', value: 'Non-binary', label: 'Non-binary', order: 3 },
  { type: 'genders', value: 'Other', label: 'Other', order: 4 },

  // Gender preferences
  { type: 'gender-preferences', value: 'Woman', label: 'Woman', order: 1 },
  { type: 'gender-preferences', value: 'Man', label: 'Man', order: 2 },

  // Relationship status
  { type: 'relationship-status', value: 'Never married', label: 'Never married', order: 1 },
  { type: 'relationship-status', value: 'Divorced', label: 'Divorced', order: 2 },
  { type: 'relationship-status', value: 'Separated', label: 'Separated', order: 3 },
  { type: 'relationship-status', value: 'Annulled', label: 'Annulled', order: 4 },
  { type: 'relationship-status', value: 'Widowed', label: 'Widowed', order: 5 },

  // Looking for
  { type: 'looking-for', value: 'Long term', label: 'Long term', order: 1 },
  { type: 'looking-for', value: 'Something Casual', label: 'Something Casual', order: 2 },
  { type: 'looking-for', value: 'Short term', label: 'Short term', order: 3 },
  { type: 'looking-for', value: 'Meet business oriented people', label: 'Meet business oriented people', order: 4 },
  { type: 'looking-for', value: 'I am not sure', label: 'I am not sure', order: 5 },
  { type: 'looking-for', value: 'A Committed relationship', label: 'A Committed relationship', order: 6 },

  // Drinking habits
  { type: 'drinking-habits', value: "No, I don't drink", label: "No, I don't drink", order: 1 },
  { type: 'drinking-habits', value: 'Socially', label: 'Socially', order: 2 },
  { type: 'drinking-habits', value: 'Rarely', label: 'Rarely', order: 3 },
  { type: 'drinking-habits', value: 'Regularly', label: 'Regularly', order: 4 },
  { type: 'drinking-habits', value: 'Prefer not to say', label: 'Prefer not to say', order: 5 },

  // Smoking habits
  { type: 'smoking-habits', value: "No, I don't smoke", label: "No, I don't smoke", order: 1 },
  { type: 'smoking-habits', value: 'Socially', label: 'Socially', order: 2 },
  { type: 'smoking-habits', value: 'Occasionally', label: 'Occasionally', order: 3 },
  { type: 'smoking-habits', value: 'Regularly', label: 'Regularly', order: 4 },
  { type: 'smoking-habits', value: 'Prefer not to say', label: 'Prefer not to say', order: 5 },

  // Occupations
  { type: 'occupations', value: 'Software Developer', label: 'Software Developer', order: 1 },
  { type: 'occupations', value: 'Graphic Designer', label: 'Graphic Designer', order: 2 },
  { type: 'occupations', value: 'Teacher', label: 'Teacher', order: 3 },
  { type: 'occupations', value: 'Doctor', label: 'Doctor', order: 4 },
  { type: 'occupations', value: 'Engineer', label: 'Engineer', order: 5 },
  { type: 'occupations', value: 'Lawyer', label: 'Lawyer', order: 6 },
  { type: 'occupations', value: 'Nurse', label: 'Nurse', order: 7 },
  { type: 'occupations', value: 'Writer', label: 'Writer', order: 8 },
  { type: 'occupations', value: 'Entrepreneur', label: 'Entrepreneur', order: 9 },
  { type: 'occupations', value: 'Photographer', label: 'Photographer', order: 10 },
  { type: 'occupations', value: 'Musician', label: 'Musician', order: 11 },
  { type: 'occupations', value: 'Student', label: 'Student', order: 12 },
  { type: 'occupations', value: 'Fashion Designer', label: 'Fashion Designer', order: 13 },
  { type: 'occupations', value: 'Model', label: 'Model', order: 14 },
  { type: 'occupations', value: 'Makeup Artist', label: 'Makeup Artist', order: 15 },
  { type: 'occupations', value: 'Hair Stylist', label: 'Hair Stylist', order: 16 },
  { type: 'occupations', value: 'Content Creator', label: 'Content Creator', order: 17 },
  { type: 'occupations', value: 'Streamer', label: 'Streamer', order: 18 },
  { type: 'occupations', value: 'Architect', label: 'Architect', order: 19 },
  { type: 'occupations', value: 'Scientist', label: 'Scientist', order: 20 },
  { type: 'occupations', value: 'Artist', label: 'Artist', order: 21 },
  { type: 'occupations', value: 'Chef', label: 'Chef', order: 22 },
  { type: 'occupations', value: 'Dancer', label: 'Dancer', order: 23 },
  { type: 'occupations', value: 'Actor', label: 'Actor', order: 24 },
  { type: 'occupations', value: 'Music Producer', label: 'Music Producer', order: 25 },
  { type: 'occupations', value: 'DJ', label: 'DJ', order: 26 },
  { type: 'occupations', value: 'Event Planner', label: 'Event Planner', order: 27 },
  { type: 'occupations', value: 'Interior Designer', label: 'Interior Designer', order: 28 },
  { type: 'occupations', value: 'Other', label: 'Other', order: 29 },

  // Interests
  { type: 'interests', value: 'Travel', label: 'Travel', category: 'lifestyle', order: 1 },
  { type: 'interests', value: 'Photography', label: 'Photography', category: 'creative', order: 2 },
  { type: 'interests', value: 'Cooking', label: 'Cooking', category: 'lifestyle', order: 3 },
  { type: 'interests', value: 'Fitness', label: 'Fitness', category: 'sports', order: 4 },
  { type: 'interests', value: 'Yoga', label: 'Yoga', category: 'sports', order: 5 },
  { type: 'interests', value: 'Reading', label: 'Reading', category: 'creative', order: 6 },
  { type: 'interests', value: 'Music', label: 'Music', category: 'creative', order: 7 },
  { type: 'interests', value: 'Movies', label: 'Movies', category: 'entertainment', order: 8 },
  { type: 'interests', value: 'Gaming', label: 'Gaming', category: 'entertainment', order: 9 },
  { type: 'interests', value: 'Hiking', label: 'Hiking', category: 'sports', order: 10 },
  { type: 'interests', value: 'Dancing', label: 'Dancing', category: 'creative', order: 11 },
  { type: 'interests', value: 'Art', label: 'Art', category: 'creative', order: 12 },
  { type: 'interests', value: 'Fashion', label: 'Fashion', category: 'lifestyle', order: 13 },
  { type: 'interests', value: 'Volunteering', label: 'Volunteering', category: 'lifestyle', order: 14 },
  { type: 'interests', value: 'Pets', label: 'Pets', category: 'lifestyle', order: 15 },
  { type: 'interests', value: 'Food', label: 'Food', category: 'lifestyle', order: 16 },
  { type: 'interests', value: 'Coffee', label: 'Coffee', category: 'lifestyle', order: 17 },
  { type: 'interests', value: 'Wine', label: 'Wine', category: 'lifestyle', order: 18 },
  { type: 'interests', value: 'Sports', label: 'Sports', category: 'sports', order: 19 },
  { type: 'interests', value: 'Writing', label: 'Writing', category: 'creative', order: 20 },

  // Religions
  { type: 'religions', value: 'Christian', label: 'Christian', order: 1 },
  { type: 'religions', value: 'Muslim', label: 'Muslim', order: 2 },
  { type: 'religions', value: 'Hindu', label: 'Hindu', order: 3 },
  { type: 'religions', value: 'Buddhist', label: 'Buddhist', order: 4 },
  { type: 'religions', value: 'Jewish', label: 'Jewish', order: 5 },
  { type: 'religions', value: 'Sikh', label: 'Sikh', order: 6 },
  { type: 'religions', value: 'Spiritual', label: 'Spiritual', order: 7 },
  { type: 'religions', value: 'Agnostic', label: 'Agnostic', order: 8 },
  { type: 'religions', value: 'Atheist', label: 'Atheist', order: 9 },
  { type: 'religions', value: 'Other', label: 'Other', order: 10 },

  // Ethnicities
  { type: 'ethnicities', value: 'Caucasian', label: 'Caucasian', order: 1 },
  { type: 'ethnicities', value: 'African', label: 'African', order: 2 },
  { type: 'ethnicities', value: 'Asian', label: 'Asian', order: 3 },
  { type: 'ethnicities', value: 'Hispanic/Latino', label: 'Hispanic/Latino', order: 4 },
  { type: 'ethnicities', value: 'Middle Eastern', label: 'Middle Eastern', order: 5 },
  { type: 'ethnicities', value: 'Native American', label: 'Native American', order: 6 },
  { type: 'ethnicities', value: 'Pacific Islander', label: 'Pacific Islander', order: 7 },
  { type: 'ethnicities', value: 'Mixed', label: 'Mixed', order: 8 },
  { type: 'ethnicities', value: 'Other', label: 'Other', order: 9 },

  // Languages
  { type: 'languages', value: 'English', label: 'English', order: 1 },
  { type: 'languages', value: 'Spanish', label: 'Spanish', order: 2 },
  { type: 'languages', value: 'French', label: 'French', order: 3 },
  { type: 'languages', value: 'German', label: 'German', order: 4 },
  { type: 'languages', value: 'Italian', label: 'Italian', order: 5 },
  { type: 'languages', value: 'Portuguese', label: 'Portuguese', order: 6 },
  { type: 'languages', value: 'Mandarin', label: 'Mandarin', order: 7 },
  { type: 'languages', value: 'Arabic', label: 'Arabic', order: 8 },
  { type: 'languages', value: 'Hindi', label: 'Hindi', order: 9 },
  { type: 'languages', value: 'Japanese', label: 'Japanese', order: 10 },
  { type: 'languages', value: 'Korean', label: 'Korean', order: 11 },
  { type: 'languages', value: 'Yoruba', label: 'Yoruba', order: 12 },
  { type: 'languages', value: 'Igbo', label: 'Igbo', order: 13 },
  { type: 'languages', value: 'Hausa', label: 'Hausa', order: 14 },

  // Education
  { type: 'education', value: 'High school', label: 'High school', order: 1 },
  { type: 'education', value: 'Some college', label: 'Some college', order: 2 },
  { type: 'education', value: 'Bachelors Degree', label: 'Bachelors Degree', order: 3 },
  { type: 'education', value: 'Masters Degree', label: 'Masters Degree', order: 4 },
  { type: 'education', value: 'PhD/Doctorate', label: 'PhD/Doctorate', order: 5 },
  { type: 'education', value: 'Trade/Technical School', label: 'Trade/Technical School', order: 6 },

  // Zodiac Signs
  { type: 'zodiac', value: 'Aries', label: 'Aries', order: 1 },
  { type: 'zodiac', value: 'Taurus', label: 'Taurus', order: 2 },
  { type: 'zodiac', value: 'Gemini', label: 'Gemini', order: 3 },
  { type: 'zodiac', value: 'Cancer', label: 'Cancer', order: 4 },
  { type: 'zodiac', value: 'Leo', label: 'Leo', order: 5 },
  { type: 'zodiac', value: 'Virgo', label: 'Virgo', order: 6 },
  { type: 'zodiac', value: 'Libra', label: 'Libra', order: 7 },
  { type: 'zodiac', value: 'Scorpio', label: 'Scorpio', order: 8 },
  { type: 'zodiac', value: 'Sagittarius', label: 'Sagittarius', order: 9 },
  { type: 'zodiac', value: 'Capricorn', label: 'Capricorn', order: 10 },
  { type: 'zodiac', value: 'Aquarius', label: 'Aquarius', order: 11 },
  { type: 'zodiac', value: 'Pisces', label: 'Pisces', order: 12 },

  // Personalities
  { type: 'personalities', value: 'Adventurous', label: 'Adventurous', order: 1 },
  { type: 'personalities', value: 'Ambitious', label: 'Ambitious', order: 2 },
  { type: 'personalities', value: 'Creative', label: 'Creative', order: 3 },
  { type: 'personalities', value: 'Easygoing', label: 'Easygoing', order: 4 },
  { type: 'personalities', value: 'Funny', label: 'Funny', order: 5 },
  { type: 'personalities', value: 'Intellectual', label: 'Intellectual', order: 6 },
  { type: 'personalities', value: 'Outgoing', label: 'Outgoing', order: 7 },
  { type: 'personalities', value: 'Passionate', label: 'Passionate', order: 8 },
  { type: 'personalities', value: 'Romantic', label: 'Romantic', order: 9 },
  { type: 'personalities', value: 'Spontaneous', label: 'Spontaneous', order: 10 },

  // Family Plans
  { type: 'family-plans', value: 'I want kids', label: 'I want kids', order: 1 },
  { type: 'family-plans', value: 'I have kids', label: 'I have kids', order: 2 },
  { type: 'family-plans', value: "I don't want kids", label: "I don't want kids", order: 3 },
  { type: 'family-plans', value: 'I am open to kids', label: 'I am open to kids', order: 4 },
  { type: 'family-plans', value: 'I prefer not to say', label: 'I prefer not to say', order: 5 },

  // Same beliefs importance
  { type: 'same-beliefs', value: 'Is very important', label: 'Is very important', order: 1 },
  { type: 'same-beliefs', value: 'Is quite important', label: 'Is quite important', order: 2 },
  { type: 'same-beliefs', value: "It doesn't matter to me at all", label: "It doesn't matter to me at all", order: 3 },
];

const nationalityData = [
  { key: "algeria", value: "Algeria" },
  { key: "angola", value: "Angola" },
  { key: "benin", value: "Benin" },
  { key: "botswana", value: "Botswana" },
  { key: "burkina-faso", value: "Burkina Faso" },
  { key: "burundi", value: "Burundi" },
  { key: "cabo-verde", value: "Cabo Verde" },
  { key: "cameroon", value: "Cameroon" },
  { key: "central-african-republic", value: "Central African Republic" },
  { key: "chad", value: "Chad" },
  { key: "comoros", value: "Comoros" },
  { key: "democratic-republic-of-the-congo", value: "Democratic Republic of the Congo" },
  { key: "republic-of-the-congo", value: "Republic of the Congo" },
  { key: "cote-d-ivoire", value: "Côte d’Ivoire" },
  { key: "djibouti", value: "Djibouti" },
  { key: "egypt", value: "Egypt" },
  { key: "equatorial-guinea", value: "Equatorial Guinea" },
  { key: "eritrea", value: "Eritrea" },
  { key: "eswatini", value: "Eswatini" },
  { key: "ethiopia", value: "Ethiopia" },
  { key: "gabon", value: "Gabon" },
  { key: "gambia", value: "Gambia" },
  { key: "ghana", value: "Ghana" },
  { key: "guinea", value: "Guinea" },
  { key: "guinea-bissau", value: "Guinea-Bissau" },
  { key: "kenya", value: "Kenya" },
  { key: "lesotho", value: "Lesotho" },
  { key: "liberia", value: "Liberia" },
  { key: "libya", value: "Libya" },
  { key: "madagascar", value: "Madagascar" },
  { key: "malawi", value: "Malawi" },
  { key: "mali", value: "Mali" },
  { key: "mauritania", value: "Mauritania" },
  { key: "mauritius", value: "Mauritius" },
  { key: "morocco", value: "Morocco" },
  { key: "mozambique", value: "Mozambique" },
  { key: "namibia", value: "Namibia" },
  { key: "niger", value: "Niger" },
  { key: "nigeria", value: "Nigeria" },
  { key: "rwanda", value: "Rwanda" },
  { key: "sao-tome-and-principe", value: "São Tomé and Príncipe" },
  { key: "senegal", value: "Senegal" },
  { key: "seychelles", value: "Seychelles" },
  { key: "sierra-leone", value: "Sierra Leone" },
  { key: "somalia", value: "Somalia" },
  { key: "south-africa", value: "South Africa" },
  { key: "south-sudan", value: "South Sudan" },
  { key: "sudan", value: "Sudan" },
  { key: "tanzania", value: "Tanzania" },
  { key: "togo", value: "Togo" },
  { key: "tunisia", value: "Tunisia" },
  { key: "uganda", value: "Uganda" },
  { key: "zambia", value: "Zambia" },
  { key: "zimbabwe", value: "Zimbabwe" },
];

const nationalityLookupEntries = nationalityData.map(({ key, value }, index) => ({
  type: "nationality",
  value: key,
  label: value,
  order: index + 1,
}));

const combinedLookupData = [...lookupData, ...nationalityLookupEntries];

const seedLookups = async () => {
  try {
    await connectDB();

    // Clear existing lookups
    await Lookup.deleteMany({});
    console.log('Cleared existing lookups');

    // Insert new lookups
    await Lookup.insertMany(combinedLookupData);
    console.log(`Successfully seeded ${combinedLookupData.length} lookup entries`);

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
