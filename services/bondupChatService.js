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
   * Get chat state (match status, message limits).
   * @param {string} chatId
   */
  getChatState: async (chatId) => {
    const res = await apiClient.get(`/bondup-chats/${chatId}/state`);
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

  /**
   * Request or accept a match in a bondup_single chat.
   * @param {string} chatId
   */
  requestMatch: async (chatId) => {
    const res = await apiClient.post(`/bondup-chats/${chatId}/match`);
    return res.data;
  },

  /**
   * Decline / withdraw a match request.
   * @param {string} chatId
   */
  declineMatch: async (chatId) => {
    const res = await apiClient.post(`/bondup-chats/${chatId}/unmatch`);
    return res.data;
  },

  /**
   * Get a user's bondup profile within chat context.
   * @param {string} chatId
   * @param {string} userId
   */
  getUserProfile: async (chatId, userId) => {
    const res = await apiClient.get(`/bondup-chats/${chatId}/user-profile/${userId}`);
    return res.data;
  },
};

export default bondupChatService;
