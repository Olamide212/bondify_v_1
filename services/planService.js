/**
 * planService.js
 * Handles all /api/plans endpoints for the Plans / Hangout feature.
 */

import apiClient from '../utils/axiosInstance';

const planService = {
  /**
   * Get active plans feed.
   * @param {{ page?: number, limit?: number, lng?: number, lat?: number, status?: string }} opts
   */
  getPlans: async ({ page = 1, limit = 30, lng, lat, status } = {}) => {
    const params = { page, limit };
    if (lng != null && lat != null) {
      params.lng = lng;
      params.lat = lat;
    }
    if (status) {
      params.status = status;
    }
    const res = await apiClient.get('/plans', { params });
    return res.data;
  },

  /**
   * Create a new plan.
   * @param {{ status: 'free'|'join_me'|'not_free', note?: string, activity?: string, location?: object, expiryHours?: number }} data
   */
  createPlan: async (data) => {
    const res = await apiClient.post('/plans', data);
    return res.data;
  },

  /** Join a plan. */
  joinPlan: async (planId) => {
    const res = await apiClient.post(`/plans/${planId}/join`);
    return res.data;
  },

  /** Leave a plan. */
  leavePlan: async (planId) => {
    const res = await apiClient.post(`/plans/${planId}/leave`);
    return res.data;
  },

  /** Delete / deactivate a plan (only author). */
  deletePlan: async (planId) => {
    const res = await apiClient.delete(`/plans/${planId}`);
    return res.data;
  },

  /** Get current user's active plans. */
  getMyPlans: async () => {
    const res = await apiClient.get('/plans/my');
    return res.data;
  },
};

export default planService;
