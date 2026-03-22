/**
 * Profile Prompt Questions - Categorized
 * 
 * Categories: Marriage, Religion, Future Plans, Family, Personality
 * Each category has up to 10 questions
 */

export const PROMPT_CATEGORIES = [
  { id: 'marriage', label: 'Marriage' },
  { id: 'religion', label: 'Religion' },
  { id: 'future', label: 'Future Plans' },
  { id: 'family', label: 'Family' },
  { id: 'personality', label: 'Personality' },
];

export const PROMPT_QUESTIONS = {
  marriage: [
    "What does marriage mean to you?",
    "How do you envision your ideal marriage?",
    "What qualities are most important in a life partner?",
    "How do you handle conflict in relationships?",
    "What's your view on traditional vs modern marriage roles?",
    "How important is communication in a marriage?",
    "What would you never compromise on in a relationship?",
    "How do you keep the spark alive in a long-term relationship?",
    "What's your love language?",
    "How do you define commitment?",
  ],
  religion: [
    "How important is faith in your daily life?",
    "What role does spirituality play in your relationships?",
    "How do you practice your beliefs?",
    "What values from your faith guide you most?",
    "How do you feel about interfaith relationships?",
    "What traditions from your religion do you cherish?",
    "How would you raise children regarding religion?",
    "What does your faith teach you about love?",
    "How has your spiritual journey shaped who you are?",
    "What does forgiveness mean in your faith?",
  ],
  future: [
    "Where do you see yourself in 5 years?",
    "What's your biggest dream for the future?",
    "How do you plan to balance career and family?",
    "What adventures are on your bucket list?",
    "How important is financial stability to you?",
    "Would you relocate for love?",
    "What legacy do you want to leave behind?",
    "How do you approach major life decisions?",
    "What does success look like to you?",
    "How do you prepare for life's uncertainties?",
  ],
  family: [
    "How close are you with your family?",
    "What family traditions do you hope to continue?",
    "How do you see your role as a parent (if applicable)?",
    "What did your family teach you about relationships?",
    "How do you handle family disagreements?",
    "What's your favorite family memory?",
    "How important are family gatherings to you?",
    "How do you feel about extended family involvement?",
    "What family values are non-negotiable for you?",
    "How do you balance partner and family time?",
  ],
  personality: [
    "How would your friends describe you in three words?",
    "What makes you laugh the most?",
    "What's your approach to handling stress?",
    "Are you more introverted or extroverted?",
    "What's your biggest passion outside of work?",
    "How do you recharge after a long week?",
    "What's a fun fact that surprises people about you?",
    "What motivates you to get out of bed every morning?",
    "How do you show someone you care?",
    "What's the best advice you've ever received?",
  ],
};

// Flatten all questions for search/validation
export const ALL_QUESTIONS = Object.values(PROMPT_QUESTIONS).flat();

// Get category label by ID
export const getCategoryLabel = (categoryId) => {
  const category = PROMPT_CATEGORIES.find((c) => c.id === categoryId);
  return category?.label || categoryId;
};

// Find which category a question belongs to
export const getQuestionCategory = (question) => {
  for (const [categoryId, questions] of Object.entries(PROMPT_QUESTIONS)) {
    if (questions.includes(question)) {
      return categoryId;
    }
  }
  return null;
};
