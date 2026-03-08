/**
 * aiService.js
 * Handles all /api/ai endpoints (powered by OpenAI on the backend).
 * No API key is needed on the client side.
 */

import apiClient from "../utils/axiosInstance";

/** Tone options for the bio generator — use these keys when calling generateBio(). */
export const BIO_TONES = [
  { key: "sincere",      label: "🥰 Sincere",      description: "Warm and genuine" },
  { key: "funny",        label: "😄 Funny",         description: "Light-hearted and witty" },
  { key: "adventurous",  label: "🌍 Adventurous",   description: "Bold and energetic" },
  { key: "professional", label: "💼 Professional",  description: "Polished and confident" },
];

const AIService = {
  /**
   * Get 3 AI-generated conversation starters tailored to a specific match.
   * The backend analyses both users' interests and personalities.
   *
   * @param {string} matchId  – _id of the Match document
   * @returns {{ suggestions: string[] }}
   *
   * @example
   *   const { data } = await AIService.getIcebreakerSuggestions('64match...');
   *   // data.suggestions = ['Hey, you also hike? ...', ...]
   */
  getIcebreakerSuggestions: async (matchId) => {
    const response = await apiClient.get(`/api/ai/icebreakers/${matchId}`);
    return response.data;
  },

  /**
   * Get an AI compatibility score between the current user and another user.
   * Analyses interests, love language, communication style, and relationship goals.
   *
   * @param {string} userId  – _id of the other user
   * @returns {{
   *   score: number,        // 0–100
   *   summary: string,
   *   strengths: string[],
   *   challenges: string[]
   * }}
   *
   * @example
   *   const { data } = await AIService.getCompatibilityScore('64user...');
   *   // data.score = 84
   */
  getCompatibilityScore: async (userId) => {
    const response = await apiClient.get(`/api/ai/compatibility/${userId}`);
    return response.data;
  },

  /**
   * Generate a profile bio for the current user.
   * The backend uses the user's occupation, interests, and personality traits.
   *
   * @param {{ tone: 'sincere'|'funny'|'adventurous'|'professional' }} data
   * @returns {{ bio: string }}
   *
   * @example
   *   const { data } = await AIService.generateBio({ tone: 'funny' });
   *   // data.bio = 'Software engineer by day, jollof rice critic by night...'
   */
  generateBio: async (data) => {
    const response = await apiClient.post("/api/ai/generate-bio", data);
    return response.data;
  },

  /**
   * Get 4 creative date ideas tailored to a specific match.
   * Pass the city to get location-relevant suggestions.
   *
   * @param {string} matchId  – _id of the Match document
   * @param {{ city?: string }} params
   * @returns {{
   *   ideas: Array<{ title: string, description: string,
   *                  estimatedCost: string, duration: string }>
   * }}
   *
   * @example
   *   const { data } = await AIService.getDateIdeas('64match...', { city: 'Lagos' });
   *   // data.ideas[0] = { title: 'Sunset Boat Ride', ... }
   */
  getDateIdeas: async (matchId, params = {}) => {
    const response = await apiClient.get(`/api/ai/date-ideas/${matchId}`, { params });
    return response.data;
  },
  /**
   * Send a message to BonBot and get a personalised reply.
   * Pass the FULL conversation history on every call so the model
   * maintains context across turns.
   *
   * @param {Array<{ role: 'user'|'assistant', content: string }>} messages
   * @returns {{ message: string, role: 'assistant' }}
   *
   * @example
   *   const { data } = await AIService.chat([
   *     { role: 'user', content: 'Give me an ice breaker for my match' },
   *   ]);
   *   // data.message = 'Try: "If you could travel anywhere tomorrow..."'
   */
  chat: async (messages) => {
    const response = await apiClient.post('/api/ai/chat', { messages });
    return response.data;
  },
};

export default AIService;
