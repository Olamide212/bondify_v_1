import apiClient from '../utils/axiosInstance';

const bondupService = {
  /**
   * Create a new Bondup.
   * @param {{ title, description, activityType, location, city, dateTime, visibility, maxParticipants }} data
   */
  createBondup: async (data) => {
    const res = await apiClient.post('/bondup/create', data);
    return res.data;
  },

  /**
   * Get all public Bondups in the current user's city.
   * @param {{ page?, limit?, activityType?, date?, sort? }} params
   */
  getPublicBondups: async (params = {}) => {
    const res = await apiClient.get('/bondup/public', { params });
    return res.data;
  },

  /**
   * Get Bondups from the user's circle (followers/following).
   * @param {{ page?, limit?, activityType?, date?, sort? }} params
   */
  getCircleBondups: async (params = {}) => {
    const res = await apiClient.get('/bondup/circle', { params });
    return res.data;
  },

  /**
   * Get Bondups the current user created or joined.
   */
  getMyBondups: async () => {
    const res = await apiClient.get('/bondup/my');
    return res.data;
  },

  /**
   * Get a single Bondup by ID.
   * @param {string} bondupId
   */
  getBondup: async (bondupId) => {
    const res = await apiClient.get(`/bondup/${bondupId}`);
    return res.data;
  },

  /**
   * Join a Bondup.
   * @param {string} bondupId
   */
  joinBondup: async (bondupId) => {
    const res = await apiClient.post(`/bondup/join/${bondupId}`);
    return res.data;
  },

  /**
   * Leave a Bondup.
   * @param {string} bondupId
   */
  leaveBondup: async (bondupId) => {
    const res = await apiClient.post(`/bondup/leave/${bondupId}`);
    return res.data;
  },

  /**
   * Delete (deactivate) a Bondup. Only the creator can do this.
   * @param {string} bondupId
   */
  deleteBondup: async (bondupId) => {
    const res = await apiClient.delete(`/bondup/${bondupId}`);
    return res.data;
  },

  /**
   * Get a bondup user's profile (no chat membership required).
   * @param {string} userId
   */
  getBondupProfile: async (userId) => {
    const res = await apiClient.get(`/bondup/profile/${userId}`);
    return res.data;
  },

  /**
   * Send a friend request to a user.
   * @param {string} userId
   */
  sendFriendRequest: async (userId) => {
    const res = await apiClient.post(`/bondup/friend-request/${userId}`);
    return res.data;
  },

  /**
   * Get pending friend requests for the current user.
   */
  getFriendRequests: async () => {
    const res = await apiClient.get('/bondup/friend-requests');
    return res.data;
  },

  /**
   * Accept a friend request.
   * @param {string} requestId
   */
  acceptFriendRequest: async (requestId) => {
    const res = await apiClient.post(`/bondup/friend-request/${requestId}/accept`);
    return res.data;
  },

  /**
   * Decline a friend request.
   * @param {string} requestId
   */
  declineFriendRequest: async (requestId) => {
    const res = await apiClient.post(`/bondup/friend-request/${requestId}/decline`);
    return res.data;
  },

  /**
   * Get friends for a user.
   * @param {string} userId
   */
  getFriends: async (userId) => {
    const res = await apiClient.get(`/bondup/friends/${userId || ''}`);
    return res.data;
  },

  /**
   * Check friend status with another user.
   * @param {string} userId
   */
  getFriendStatus: async (userId) => {
    const res = await apiClient.get(`/bondup/friend-status/${userId}`);
    return res.data;
  },

  /**
   * Get mutual friends with another user.
   * @param {string} userId
   */
  getMutualFriends: async (userId) => {
    const res = await apiClient.get(`/bondup/mutual-friends/${userId}`);
    return res.data;
  },

  /**
   * Get the current user's social profile.
   */
  getSocialProfile: async () => {
    const res = await apiClient.get('/bondup/social-profile');
    return res.data;
  },

  /**
   * Update the current user's social profile.
   * @param {{ userName?, displayName?, profilePhoto?, bio? }} data
   */
  updateSocialProfile: async (data) => {
    const res = await apiClient.patch('/bondup/social-profile', data);
    return res.data;
  },

  /**
   * Upload a social profile photo.
   * @param {FormData} formData
   */
  uploadSocialPhoto: async (formData) => {
    const res = await apiClient.post('/bondup/social-profile/photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};

export default bondupService;
