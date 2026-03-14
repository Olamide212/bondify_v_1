/**
 * feedService.js
 * Handles all /api/feed endpoints for the social feed feature.
 */

import apiClient from '../utils/axiosInstance';

const feedService = {
  /**
   * Get paginated feed posts.
   * @param {{ tab?: 'foryou'|'new'|'following', page?: number, limit?: number }} params
   */
  getFeed: async ({ tab = 'foryou', page = 1, limit = 20 } = {}) => {
    const res = await apiClient.get('/feed', { params: { tab, page, limit } });
    return res.data;
  },

  /**
   * Create a new post.
   * @param {{ content: string, mediaUrls?: string[], tags?: string[] }} data
   */
  createPost: async (data) => {
    const res = await apiClient.post('/feed', data);
    return res.data;
  },

  /** Get a single post by ID. */
  getPost: async (postId) => {
    const res = await apiClient.get(`/feed/${postId}`);
    return res.data;
  },

  /** Delete a post. */
  deletePost: async (postId) => {
    const res = await apiClient.delete(`/feed/${postId}`);
    return res.data;
  },

  /** Toggle like on a post. */
  toggleLike: async (postId) => {
    const res = await apiClient.post(`/feed/${postId}/like`);
    return res.data;
  },

  /** Toggle save on a post. */
  toggleSave: async (postId) => {
    const res = await apiClient.post(`/feed/${postId}/save`);
    return res.data;
  },

  /** Add a comment to a post. */
  addComment: async (postId, content) => {
    const res = await apiClient.post(`/feed/${postId}/comments`, { content });
    return res.data;
  },

  /** Delete a comment. */
  deleteComment: async (postId, commentId) => {
    const res = await apiClient.delete(`/feed/${postId}/comments/${commentId}`);
    return res.data;
  },

  /** Follow / unfollow a user. */
  toggleFollow: async (userId) => {
    const res = await apiClient.post(`/feed/follow/${userId}`);
    return res.data;
  },

  /** Get the current user's saved posts. */
  getSavedPosts: async () => {
    const res = await apiClient.get('/feed/saved');
    return res.data;
  },

  /** Get posts and profile stats for a specific user. */
  getUserProfile: async (userId, page = 1) => {
    const res = await apiClient.get(`/feed/profile/${userId}`, { params: { page } });
    return res.data;
  },

  /** Update social-profile fields (userName, profilePhoto). */
  updateSocialProfile: async (data) => {
    const res = await apiClient.patch('/feed/social-profile', data);
    return res.data;
  },

  /** Get AI post suggestions. */
  suggestPost: async (context = '') => {
    const res = await apiClient.post('/ai/suggest-post', { context });
    return res.data;
  },
};

export default feedService;
