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
};

export default bondupService;
