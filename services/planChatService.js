/**
 * planChatService.js
 * Handles all /api/plan-chats endpoints for plan group chats.
 */

import apiClient from '../utils/axiosInstance';

const planChatService = {
  /**
   * Start or get existing group chat for a plan.
   * @param {string} planId
   */
  startGroupChat: async (planId) => {
    const res = await apiClient.post(`/plan-chats/${planId}/start`);
    return res.data;
  },

  /**
   * Get chat details (members, plan info).
   * @param {string} chatId
   */
  getChatDetails: async (chatId) => {
    const res = await apiClient.get(`/plan-chats/${chatId}`);
    return res.data;
  },

  /**
   * Get messages for a plan group chat.
   * @param {string} chatId
   * @param {{ page?: number, limit?: number }} opts
   */
  getMessages: async (chatId, { page = 1, limit = 50 } = {}) => {
    const res = await apiClient.get(`/plan-chats/${chatId}/messages`, {
      params: { page, limit },
    });
    return res.data;
  },

  /**
   * Send a message to a plan group chat.
   * @param {string} chatId
   * @param {{ content?: string, type?: string, mediaUrl?: string }} data
   */
  sendMessage: async (chatId, data) => {
    const res = await apiClient.post(`/plan-chats/${chatId}/messages`, data);
    return res.data;
  },
};

export default planChatService;
