/**
 * Local Lookup Data
 * 
 * Centralized lookup options for all dropdown/selection fields.
 * This eliminates the need for API calls and works offline.
 */

// Import existing data files
import { BLOOD_GROUP_OPTIONS } from './bloodGroupData';
import { DRINKING_HABITS_OPTIONS } from './drinkingHabitsData';
import { EDUCATION_OPTIONS } from './educationData';
import { ETHNICITY_OPTIONS } from './ethnicityData';
import { FAMILY_PLAN_OPTIONS } from './FamilyPlanData';
import { GENDER_PREFERENCE_OPTIONS } from './genderPreferenceData';
import { GENOTYPE_OPTIONS } from './genotypeData';
import { INTEREST_CATEGORIES } from './interestData';
import { RELATIONSHIP_OPTIONS } from './lookingForData';
import { RELATIONSHIP_STATUS_OPTIONS } from './relationshipStatusData';
import { RELIGION_PRACTICE_OPTIONS } from './religionPracticeData';
import { RELOCATION_PREFERENCE_OPTIONS } from './relocationPreferenceData';
import { SMOKING_HABITS_OPTIONS } from './smokingHabitsData';

// Convert INTEREST_CATEGORIES to flat label/value array for lookup
const INTEREST_OPTIONS = INTEREST_CATEGORIES.flatMap(category =>
  category.items.map(item => ({ label: item, value: item }))
);

// ─── Additional Options - Values must match backend User model enums ─────────

export const GENDER_OPTIONS = [
  { label: 'Male', value: 'Male' },
  { label: 'Female', value: 'Female' },
  { label: 'Non-binary', value: 'Non-binary' },
  { label: 'Other', value: 'Other' },
];

export const RELIGION_OPTIONS = [
  { label: 'Christian', value: 'Christian' },
  { label: 'Muslim', value: 'Muslim' },
  { label: 'Hindu', value: 'Hindu' },
  { label: 'Buddhist', value: 'Buddhist' },
  { label: 'Jewish', value: 'Jewish' },
  { label: 'Sikh', value: 'Sikh' },
  { label: 'Spiritual', value: 'Spiritual' },
  { label: 'Agnostic', value: 'Agnostic' },
  { label: 'Atheist', value: 'Atheist' },
  { label: 'Other', value: 'Other' },
];

export const SAME_BELIEFS_OPTIONS = [
  { label: 'Is very important', value: 'Is very important', description: 'Must share my beliefs' },
  { label: 'Is quite important', value: 'Is quite important', description: 'Would appreciate it' },
  { label: "It doesn't matter to me at all", value: "It doesn't matter to me at all", description: 'Open to different beliefs' },
];

export const ZODIAC_OPTIONS = [
  { label: 'Aries', value: 'Aries' },
  { label: 'Taurus', value: 'Taurus' },
  { label: 'Gemini', value: 'Gemini' },
  { label: 'Cancer', value: 'Cancer' },
  { label: 'Leo', value: 'Leo' },
  { label: 'Virgo', value: 'Virgo' },
  { label: 'Libra', value: 'Libra' },
  { label: 'Scorpio', value: 'Scorpio' },
  { label: 'Sagittarius', value: 'Sagittarius' },
  { label: 'Capricorn', value: 'Capricorn' },
  { label: 'Aquarius', value: 'Aquarius' },
  { label: 'Pisces', value: 'Pisces' },
];

export const OCCUPATION_OPTIONS = [
  { label: 'Software Developer', value: 'Software Developer' },
  { label: 'Graphic Designer', value: 'Graphic Designer' },
  { label: 'Teacher', value: 'Teacher' },
  { label: 'Doctor', value: 'Doctor' },
  { label: 'Engineer', value: 'Engineer' },
  { label: 'Lawyer', value: 'Lawyer' },
  { label: 'Nurse', value: 'Nurse' },
  { label: 'Writer', value: 'Writer' },
  { label: 'Entrepreneur', value: 'Entrepreneur' },
  { label: 'Photographer', value: 'Photographer' },
  { label: 'Musician', value: 'Musician' },
  { label: 'Student', value: 'Student' },
  { label: 'Fashion Designer', value: 'Fashion Designer' },
  { label: 'Model', value: 'Model' },
  { label: 'Makeup Artist', value: 'Makeup Artist' },
  { label: 'Hair Stylist', value: 'Hair Stylist' },
  { label: 'Content Creator', value: 'Content Creator' },
  { label: 'Streamer', value: 'Streamer' },
  { label: 'Architect', value: 'Architect' },
  { label: 'Scientist', value: 'Scientist' },
  { label: 'Artist', value: 'Artist' },
  { label: 'Chef', value: 'Chef' },
  { label: 'Dancer', value: 'Dancer' },
  { label: 'Actor', value: 'Actor' },
  { label: 'Music Producer', value: 'Music Producer' },
  { label: 'DJ', value: 'DJ' },
  { label: 'Event Planner', value: 'Event Planner' },
  { label: 'Interior Designer', value: 'Interior Designer' },
  { label: 'Other', value: 'Other' },
];

export const EXERCISE_HABITS_OPTIONS = [
  { label: 'Never', value: 'Never', description: 'I don\'t exercise' },
  { label: 'Rarely', value: 'Rarely', description: 'Exercise occasionally' },
  { label: 'Sometimes', value: 'Sometimes', description: 'A few times a week' },
  { label: 'Often', value: 'Often', description: 'Most days' },
  { label: 'Daily', value: 'Daily', description: 'Exercise every day' },
];

export const PETS_OPTIONS = [
  { label: 'I have pets', value: 'I have pets' },
  { label: 'I want pets', value: 'I want pets' },
  { label: "I don't want pets", value: "I don't want pets" },
  { label: 'Allergic to pets', value: 'Allergic to pets' },
  { label: 'Prefer not to say', value: 'Prefer not to say' },
];

export const COMMUNICATION_STYLE_OPTIONS = [
  { label: 'Direct', value: 'Direct', description: 'Straightforward and clear' },
  { label: 'Thoughtful', value: 'Thoughtful', description: 'Careful and considered' },
  { label: 'Emotional', value: 'Emotional', description: 'Express feelings openly' },
  { label: 'Logical', value: 'Logical', description: 'Fact-based and rational' },
  { label: 'Balanced', value: 'Balanced', description: 'Mix of all styles' },
];

export const LOVE_LANGUAGE_OPTIONS = [
  { label: 'Words of Affirmation', value: 'Words of Affirmation', description: 'Express love through compliments' },
  { label: 'Quality Time', value: 'Quality Time', description: 'Value undivided attention' },
  { label: 'Physical Touch', value: 'Physical Touch', description: 'Express affection physically' },
  { label: 'Acts of Service', value: 'Acts of Service', description: 'Show love by helping' },
  { label: 'Receiving Gifts', value: 'Receiving Gifts', description: 'Feel loved with thoughtful presents' },
];

export const FINANCIAL_STYLE_OPTIONS = [
  { label: 'Spender', value: 'Spender', description: 'Enjoy spending freely' },
  { label: 'Saver', value: 'Saver', description: 'Focus on saving money' },
  { label: 'Investor', value: 'Investor', description: 'Put money to work' },
  { label: 'Balanced', value: 'Balanced', description: 'Mix of saving and spending' },
  { label: 'Prefer not to say', value: 'Prefer not to say', description: 'Keep this private' },
];

export const LANGUAGE_OPTIONS = [
  { label: 'English', value: 'English' },
  { label: 'Spanish', value: 'Spanish' },
  { label: 'French', value: 'French' },
  { label: 'German', value: 'German' },
  { label: 'Italian', value: 'Italian' },
  { label: 'Portuguese', value: 'Portuguese' },
  { label: 'Mandarin', value: 'Mandarin' },
  { label: 'Arabic', value: 'Arabic' },
  { label: 'Hindi', value: 'Hindi' },
  { label: 'Japanese', value: 'Japanese' },
  { label: 'Korean', value: 'Korean' },
  { label: 'Yoruba', value: 'Yoruba' },
  { label: 'Igbo', value: 'Igbo' },
  { label: 'Hausa', value: 'Hausa' },
];

export const PERSONALITY_OPTIONS = [
  { label: 'Adventurous', value: 'Adventurous' },
  { label: 'Ambitious', value: 'Ambitious' },
  { label: 'Creative', value: 'Creative' },
  { label: 'Easygoing', value: 'Easygoing' },
  { label: 'Funny', value: 'Funny' },
  { label: 'Intellectual', value: 'Intellectual' },
  { label: 'Outgoing', value: 'Outgoing' },
  { label: 'Passionate', value: 'Passionate' },
  { label: 'Romantic', value: 'Romantic' },
  { label: 'Spontaneous', value: 'Spontaneous' },
];

export const FAVORITE_MUSIC_OPTIONS = [
  { label: 'Pop', value: 'Pop' },
  { label: 'Rock', value: 'Rock' },
  { label: 'Jazz', value: 'Jazz' },
  { label: 'Classical', value: 'Classical' },
  { label: 'Hip Hop', value: 'Hip Hop' },
  { label: 'Electronic', value: 'Electronic' },
  { label: 'Country', value: 'Country' },
  { label: 'R&B', value: 'R&B' },
  { label: 'Reggae', value: 'Reggae' },
  { label: 'Blues', value: 'Blues' },
  { label: 'Folk', value: 'Folk' },
  { label: 'Indie', value: 'Indie' },
  { label: 'Alternative', value: 'Alternative' },
  { label: 'Metal', value: 'Metal' },
];

// ─── Unified Lookup Map ──────────────────────────────────────────────────────

/**
 * Map of lookup type keys to their local data arrays.
 * Keys should match the lookup type strings used in the app.
 */
export const LOOKUP_DATA = {
  // Existing data files
  'education': EDUCATION_OPTIONS,
  'ethnicities': ETHNICITY_OPTIONS,
  'ethnicity': ETHNICITY_OPTIONS,
  'drinking-habits': DRINKING_HABITS_OPTIONS,
  'smoking-habits': SMOKING_HABITS_OPTIONS,
  'family-plans': FAMILY_PLAN_OPTIONS,
  'relationship-status': RELATIONSHIP_STATUS_OPTIONS,
  'looking-for': RELATIONSHIP_OPTIONS,
  'religion-practice': RELIGION_PRACTICE_OPTIONS,
  'relocation-preference': RELOCATION_PREFERENCE_OPTIONS,
  'gender-preferences': GENDER_PREFERENCE_OPTIONS,
  'blood-group': BLOOD_GROUP_OPTIONS,
  'genotype': GENOTYPE_OPTIONS,
  'interests': INTEREST_OPTIONS,
  'genders': GENDER_OPTIONS,
  'religions': RELIGION_OPTIONS,
  'same-beliefs': SAME_BELIEFS_OPTIONS,
  'zodiac': ZODIAC_OPTIONS,
  'occupations': OCCUPATION_OPTIONS,
  'exercise-habits': EXERCISE_HABITS_OPTIONS,
  'pets': PETS_OPTIONS,
  'communication-style': COMMUNICATION_STYLE_OPTIONS,
  'love-language': LOVE_LANGUAGE_OPTIONS,
  'financial-style': FINANCIAL_STYLE_OPTIONS,
  'languages': LANGUAGE_OPTIONS,
  'personalities': PERSONALITY_OPTIONS,
  'favorite-music': FAVORITE_MUSIC_OPTIONS,
};

/**
 * Get lookup options by type.
 * Returns empty array if type is not found.
 */
export const getLookupOptions = (type) => {
  return LOOKUP_DATA[type] || [];
};

/**
 * Check if a lookup type has local data available.
 */
export const hasLocalLookup = (type) => {
  return type in LOOKUP_DATA;
};
