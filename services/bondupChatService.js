import apiClient from '../utils/axiosInstance';

const bondupChatService = {
  /**
   * Start (or get existing) group/single chat for a Bondup.
   * @param {string} bondupId
   */
  startChat: async (bondupId) => {
    const res = await apiClient.post(`/bondup-chats/${bondupId}/start`);
    return res.data;
  },

  /**
   * Get chat details (members, bondup info).
   * @param {string} chatId
   */
  getChatDetails: async (chatId) => {
    const res = await apiClient.get(`/bondup-chats/${chatId}`);
    return res.data;
  },

  /**
   * Get messages for a Bondup chat.
   * @param {string} chatId
   * @param {{ page?, limit? }} params
   */
  getMessages: async (chatId, params = {}) => {
    const res = await apiClient.get(`/bondup-chats/${chatId}/messages`, { params });
    return res.data;
  },

  /**
   * Send a message in a Bondup chat.
   * @param {string} chatId
   * @param {{ content, type?, mediaUrl? }} data
   */
  sendMessage: async (chatId, data) => {
    const res = await apiClient.post(`/bondup-chats/${chatId}/messages`, data);
    return res.data;
  },
};

export default bondupChatService;
