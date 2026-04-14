/**
 * messageRequestService.js
 * 
 * Handles all /api/message-requests endpoints.
 * Message requests are compliments/photo comments sent to unmatched users
 * that expire after 3 days unless accepted.
 */

import apiClient from "../utils/axiosInstance";

const MessageRequestService = {
  /**
   * Send a message request (compliment/photo comment) to another user.
   * @param {{ 
   *   targetUserId: string, 
   *   content: string, 
   *   type?: 'compliment' | 'photo_comment' | 'icebreaker',
   *   imageIndex?: number,
   *   imageUrl?: string
   * }} data
   * @returns {Promise<{ request: { id, type, content, expiresAt, status } }>}
   */
  sendRequest: async (data) => {
    const response = await apiClient.post("/message-requests", data);
    return response.data?.data ?? response.data;
  },

  /**
   * Get all pending message requests received by current user.
   * @param {{ status?: 'pending' | 'all', page?: number, limit?: number }} params
   * @returns {Promise<{ requests: Array, pagination: { page, limit, total, pages } }>}
   */
  getReceivedRequests: async (params = {}) => {
    const response = await apiClient.get("/message-requests/received", { params });
    return response.data?.data ?? response.data;
  },

  /**
   * Get all message requests sent by current user.
   * @param {{ status?: 'pending' | 'accepted' | 'declined' | 'all', page?: number, limit?: number }} params
   * @returns {Promise<{ requests: Array, pagination: { page, limit, total, pages } }>}
   */
  getSentRequests: async (params = {}) => {
    const response = await apiClient.get("/message-requests/sent", { params });
    return response.data?.data ?? response.data;
  },

  /**
   * Accept a message request (creates a match).
   * @param {string} requestId
   * @returns {Promise<{ matchId: string, matchedUser: { id, name, image } }>}
   */
  acceptRequest: async (requestId) => {
    const response = await apiClient.patch(`/message-requests/${requestId}/accept`);
    return response.data?.data ?? response.data;
  },

  /**
   * Decline a message request.
   * @param {string} requestId
   * @returns {Promise<{ success: boolean }>}
   */
  declineRequest: async (requestId) => {
    const response = await apiClient.patch(`/message-requests/${requestId}/decline`);
    return response.data;
  },

  /**
   * Get count of pending (unread) message requests.
   * @returns {Promise<{ count: number }>}
   */
  getPendingCount: async () => {
    const response = await apiClient.get("/message-requests/count");
    return response.data?.data ?? response.data;
  },

  /**
   * Mark message requests as read.
   * @param {{ requestIds?: string[] }} data - Pass requestIds to mark specific ones, or omit to mark all
   */
  markAsRead: async (data = {}) => {
    const response = await apiClient.patch("/message-requests/mark-read", data);
    return response.data;
  },
};

export default MessageRequestService;
