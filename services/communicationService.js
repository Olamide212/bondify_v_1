/**
 * Communication Service
 * 
 * Frontend service for communication score and feedback API.
 */

import api from '../utils/axiosInstance';

/**
 * Submit feedback about a user's communication
 * 
 * @param {Object} params
 * @param {string} params.aboutUserId - User ID to give feedback about
 * @param {string} params.matchId - Match/conversation ID
 * @param {string} params.feedbackType - Type of feedback
 * @param {string} [params.comment] - Optional comment
 * @param {number} [params.messagesExchanged] - Number of messages exchanged
 * @returns {Promise<Object>}
 */
export const submitFeedback = async ({
  aboutUserId,
  matchId,
  feedbackType,
  comment,
  messagesExchanged,
}) => {
  const response = await api.post('/communication/feedback', {
    aboutUserId,
    matchId,
    feedbackType,
    comment,
    messagesExchanged,
  });
  return response.data;
};

/**
 * Get a user's communication score
 * 
 * @param {string} userId - User ID to get score for
 * @returns {Promise<Object>}
 */
export const getCommunicationScore = async (userId) => {
  const response = await api.get(`/communication/score/${userId}`);
  return response.data;
};

/**
 * Get feedback you've given for a specific match
 * 
 * @param {string} matchId - Match ID
 * @returns {Promise<Object>}
 */
export const getMyFeedback = async (matchId) => {
  const response = await api.get(`/communication/my-feedback/${matchId}`);
  return response.data;
};

/**
 * Check if user should be prompted to give feedback
 * 
 * @param {string} matchId - Match ID
 * @returns {Promise<Object>}
 */
export const shouldPromptFeedback = async (matchId) => {
  const response = await api.get(`/communication/should-prompt/${matchId}`);
  return response.data;
};

/**
 * Feedback types with display info
 */
export const FEEDBACK_TYPES = {
  // Positive
  responsive: {
    label: 'Very Responsive',
    description: 'Replies quickly and engages well',
    emoji: '⚡',
    color: '#10B981', // green
    category: 'positive',
  },
  friendly: {
    label: 'Friendly',
    description: 'Pleasant and respectful communication',
    emoji: '😊',
    color: '#3B82F6', // blue
    category: 'positive',
  },
  genuine: {
    label: 'Genuine',
    description: 'Seems like a real, authentic person',
    emoji: '✨',
    color: '#8B5CF6', // purple
    category: 'positive',
  },
  // Negative
  slow_to_reply: {
    label: 'Slow to Reply',
    description: 'Takes a long time to respond',
    emoji: '🐢',
    color: '#F59E0B', // amber
    category: 'negative',
  },
  unresponsive: {
    label: 'Unresponsive',
    description: 'Barely replies or ignores messages',
    emoji: '😶',
    color: '#6B7280', // gray
    category: 'negative',
  },
  suspicious: {
    label: 'Suspicious',
    description: 'May be fake, scammer, or catfish',
    emoji: '⚠️',
    color: '#EF4444', // red
    category: 'warning',
  },
  inappropriate: {
    label: 'Inappropriate',
    description: 'Sends inappropriate or offensive content',
    emoji: '🚫',
    color: '#DC2626', // dark red
    category: 'warning',
  },
};

/**
 * Communication score levels with display info
 */
export const SCORE_LEVELS = {
  excellent: {
    label: 'Excellent',
    description: 'Very responsive, verified communicator',
    emoji: '🌟',
    color: '#10B981', // green
    bgColor: '#D1FAE5',
  },
  good: {
    label: 'Good',
    description: 'Regularly responds, reliable',
    emoji: '✅',
    color: '#3B82F6', // blue
    bgColor: '#DBEAFE',
  },
  average: {
    label: 'Average',
    description: 'Moderate response rate',
    emoji: '😐',
    color: '#F59E0B', // amber
    bgColor: '#FEF3C7',
  },
  slow: {
    label: 'Slow',
    description: 'Takes time but replies',
    emoji: '🐢',
    color: '#F97316', // orange
    bgColor: '#FFEDD5',
  },
  unresponsive: {
    label: 'Unresponsive',
    description: 'Rarely replies',
    emoji: '😶',
    color: '#6B7280', // gray
    bgColor: '#F3F4F6',
  },
  suspicious: {
    label: 'Suspicious',
    description: 'Flagged by multiple users',
    emoji: '⚠️',
    color: '#EF4444', // red
    bgColor: '#FEE2E2',
  },
  new: {
    label: 'New User',
    description: 'Not enough feedback yet',
    emoji: '🆕',
    color: '#8B5CF6', // purple
    bgColor: '#EDE9FE',
  },
};
