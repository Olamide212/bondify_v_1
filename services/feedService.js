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
  addComment: async (postId, content, parentId = null) => {
    const res = await apiClient.post(`/feed/${postId}/comments`, { content, parentId });
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

  /** Get the current user's own social profile (profilePhoto, userName, stats). */
  getSocialProfile: async () => {
    const res = await apiClient.get('/feed/social-profile');
    return res.data;
  },

  /** Toggle like on a comment. */
  toggleCommentLike: async (postId, commentId) => {
    const res = await apiClient.post(`/feed/${postId}/comments/${commentId}/like`);
    return res.data;
  },

  /** Upload post media (images). Returns array of { url, publicId }. */
  uploadPostMedia: async (files) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('media', {
        uri: file.uri,
        name: file.fileName || `photo_${Date.now()}.jpg`,
        type: file.type || 'image/jpeg',
      });
    });
    const res = await apiClient.post('/upload/post-media', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  /** Get AI post suggestions. */
  suggestPost: async (context = '') => {
    const res = await apiClient.post('/ai/suggest-post', { context });
    return res.data;
  },

  /** Get a user's posts. */
  getUserPosts: async (userId) => {
    const res = await apiClient.get(`/feed/user/${userId}/posts`).catch(() => ({ data: [] }));
    return res.data ? { data: Array.isArray(res.data) ? res.data : res.data.data || [] } : { data: [] };
  },

  /** Get a user's comments. */
  getUserComments: async (userId) => {
    const res = await apiClient.get(`/feed/user/${userId}/comments`).catch(() => ({ data: [] }));
    return res.data ? { data: Array.isArray(res.data) ? res.data : res.data.data || [] } : { data: [] };
  },

  /** Get a user's liked posts. */
  getUserLikes: async (userId) => {
    const res = await apiClient.get(`/feed/user/${userId}/likes`).catch(() => ({ data: [] }));
    return res.data ? { data: Array.isArray(res.data) ? res.data : res.data.data || [] } : { data: [] };
  },

  /** Check follow status with another user. */
  checkFollowStatus: async (userId) => {
    const res = await apiClient.get(`/feed/follow-status/${userId}`).catch(() => ({ data: { isFollowing: false } }));
    return res.data;
  },

  /** Follow a user. */
  followUser: async (userId) => {
    const res = await apiClient.post(`/feed/follow/${userId}`);
    return res.data;
  },

  /** Unfollow a user. */
  unfollowUser: async (userId) => {
    const res = await apiClient.delete(`/feed/follow/${userId}`);
    return res.data;
  },
};

export default feedService;
