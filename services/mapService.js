/**
 * mapService.js
 * All map-related API calls.
 */

import apiClient from '../utils/axiosInstance'; 

const mapService = {

  /** Push updated GPS coords to the server */
  updateLocation: async ({ latitude, longitude, city, state, country } = {}) => {
    const { data } = await apiClient.patch('/map/location', {
      latitude, longitude, city, state, country,
    });
    return data;
  },

  /**
   * Fetch nearby users.
   * @param {{ latitude, longitude, radiusKm?, religion?, lookingFor?, gender?, minAge?, maxAge?, limit? }} params
   */
  getNearbyUsers: async (params = {}) => {
    const { data } = await apiClient.get('/map/nearby', { params });
    return data; // { success, data: User[], total }
  },

  /** Get my current active status */
  getMyStatus: async () => {
    const { data } = await apiClient.get('/map/status');
    return data.data; // UserStatus | null
  },

  /**
   * Create (or replace) my status.
   * @param {{ text?, imageUrl?, imagePublicId?, latitude, longitude }} payload
   */
  createStatus: async (payload) => {
    const { data } = await apiClient.post('/map/status', payload);
    return data.data;
  },

  /** Delete my status */
  deleteStatus: async () => {
    const { data } = await apiClient.delete('/map/status');
    return data;
  },

  /**
   * React to someone's status.
   * @param {string} statusId
   * @param {'heart'|'fire'|'laugh'|'wave'|null} reaction  — null to remove
   */
  reactToStatus: async (statusId, reaction) => {
    const { data } = await apiClient.post(`/map/status/${statusId}/react`, { reaction });
    return data;
  },

  /**
   * Get AI-generated status text suggestions.
   * @param {{ mood?: string, context?: string }} hints
   */
  getAISuggestions: async (hints = {}) => {
    const { data } = await apiClient.post('/map/status/ai-suggest', hints);
    return data.data; // string[]
  },
};

export default mapService;