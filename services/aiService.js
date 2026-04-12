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
   *
   * @param {string} matchId
   * @returns {{ suggestions: string[] }}
   */
  getIcebreakerSuggestions: async (matchId) => {
    const response = await apiClient.get(`/ai/icebreakers/${matchId}`);
    return response.data?.data ?? response.data;
  },

  /**
   * Get an AI compatibility score between the current user and another user.
   *
   * @param {string} userId
   * @returns {{ score: number, summary: string, strengths: string[], challenges: string[] }}
   */
  getCompatibilityScore: async (userId) => {
    const response = await apiClient.get(`/ai/compatibility/${userId}`);
    return response.data?.data ?? response.data;
  },

  /**
   * Get an AI match suggestion for a potential match.
   *
   * @param {string} userId
   * @returns {{ isGoodMatch: boolean, confidence: number, reason: string, suggestion: string }}
   */
  getMatchSuggestion: async (userId) => {
    const response = await apiClient.get(`/ai/match-suggestion/${userId}`);
    return response.data?.data ?? response.data;
  },

  /**
   * Generate a profile bio for the current user.
   *
   * @param {{ tone: 'sincere'|'funny'|'adventurous'|'professional' }} data
   * @returns {{ bio: string }}
   */
  generateBio: async (data) => {
    const response = await apiClient.post("/ai/generate-bio", data);
    // Handle nested response structure: { success: true, data: { bio } }
    return response.data?.data ?? response.data;
  },

  /**
   * Get 4 creative date ideas tailored to a specific match.
   *
   * @param {string} matchId
   * @param {{ city?: string }} params
   * @returns {{ ideas: Array<{ title: string, description: string, estimatedCost: string, duration: string }> }}
   */
  getDateIdeas: async (matchId, params = {}) => {
    const response = await apiClient.get(`/ai/date-ideas/${matchId}`, { params });
    return response.data?.data ?? response.data;
  },

  /**
   * Send a message to BonBot and get a personalised reply.
   *
   * @param {Array<{ role: 'user'|'assistant', content: string }>} messages
   * @returns {{ message: string, role: 'assistant' }}
   */
  chat: async (messages) => {
    const response = await apiClient.post('/ai/chat', { messages });
    return response.data?.data ?? response.data;
  },

  /**
   * Generate a suggested first message to send to another user's profile.
   * The backend uses the target user's interests, occupation, and lookingFor
   * to craft a personalised opener.
   *
   * @param {string} targetUserId  – _id of the user being viewed
   * @returns {{ suggestion: string }}
   *
   * @example
   *   const { data } = await AIService.getMessageSuggestion('64user...');
   *   // data.suggestion = "Your love for hiking and jazz is such a rare combo 🎵"
   */
  getMessageSuggestion: async (targetUserId) => {
    const response = await apiClient.post('/ai/suggest-message', { targetUserId });
    return response.data?.data ?? response.data;
  },

  /**
   * Get an AI-generated photo compliment / pick-up line for a user's photo.
   *
   * @param {string} targetUserId – _id of the user being viewed
   * @param {number} [imageIndex=0] – index of the photo to reference
   * @returns {{ suggestion: string }}
   */
  getPhotoCommentSuggestion: async (targetUserId, imageIndex = 0) => {
    const response = await apiClient.post('/ai/suggest-photo-comment', {
      targetUserId,
      imageIndex,
    });
    return response.data?.data ?? response.data;
  },

  /**
   * Generate a profile bio based on a custom prompt.
   *
   * @param {{ prompt: string }} data
   * @returns {{ bio: string }}
   */
  generateBioFromPrompt: async (data) => {
    const response = await apiClient.post("/ai/generate-bio-from-prompt", data);
    return response.data?.data ?? response.data;
  },

  /**
   * Generate prompt suggestions for bio creation.
   *
   * @returns {{ prompts: string[] }}
   */
  generatePrompts: async () => {
    const response = await apiClient.get("/ai/generate-prompts");
    return response.data?.data ?? response.data;
  },

  /**
   * Generate conversation starter prompts for profiles.
   *
   * @returns {{ prompts: string[] }}
   */
  generateConversationPrompts: async () => {
    const response = await apiClient.get("/ai/generate-conversation-prompts");
    return response.data?.data ?? response.data;
  },

  /**
   * Generate profile questions for users to answer.
   *
   * @returns {{ questions: string[] }}
   */
  generateProfileQuestions: async () => {
    const response = await apiClient.get("/ai/generate-profile-questions");
    return response.data?.data ?? response.data;
  },

  /**
   * Generate music genre suggestions.
   *
   * @returns {{ genres: string[] }}
   */
  generateMusicSuggestions: async () => {
    const response = await apiClient.get("/ai/generate-music-suggestions");
    return response.data?.data ?? response.data;
  },

  /**
   * Generate video content suggestions.
   *
   * @returns {{ videos: string[] }}
   */
  generateVideoSuggestions: async () => {
    const response = await apiClient.get("/ai/generate-video-suggestions");
    return response.data?.data ?? response.data;
  },

  /**
   * Generate fun activity suggestions.
   *
   * @returns {{ activities: string[] }}
   */
  generateActivitySuggestions: async () => {
    const response = await apiClient.get("/ai/generate-activity-suggestions");
    return response.data?.data ?? response.data;
  },

/**
   * Natural-language profile search powered by BonBot.
   * The backend extracts intent (location, interests, age, gender, lookingFor)
   * from the query and returns ranked profile cards + a friendly bot reply.
   *
   * @param {string} query  – e.g. "show me people near me who love music"
   * @returns {{ message: string, profiles: ProfileCard[], total: number }}
   */
  searchProfiles: async (query) => {
    const response = await apiClient.post('/ai/search-profiles', { query });
    return response.data;
  },

  /**
   * AI Find My Matches — uses AI to analyze the user's profile and rank
   * the best compatible matches from the discovery pool.
   *
   * @returns {{ message: string, matches: MatchProfile[], total: number }}
   */
  findMyMatches: async () => {
    const response = await apiClient.get('/ai/find-my-matches');
    return response.data?.data ?? response.data;
  },

  /**
   * Get AI-generated reply suggestions based on the last message received.
   * Perfect for quick, contextual responses in chat.
   *
   * @param {string} matchId – The match ID for the conversation
   * @param {string} lastMessage – The text of the last received message
   * @param {Array<{ sender: 'me'|'them', text: string }>} [conversationContext] – Recent messages for context
   * @returns {{ suggestions: string[] }}
   *
   * @example
   *   const { suggestions } = await AIService.suggestReplies('matchId123', 'What do you do for fun?', []);
   *   // suggestions = ["I love hiking on weekends! What about you?", "Usually catching up on good music 🎵", ...]
   */
  suggestReplies: async (matchId, lastMessage, conversationContext = []) => {
    const response = await apiClient.post('/ai/suggest-replies', {
      matchId,
      lastMessage,
      conversationContext,
    });
    return response.data?.data ?? response.data;
  },

};

export default AIService;