import apiClient from "../utils/axiosInstance";

/**
 * Send a comment on a specific photo of a profile.
 *
 * POST /api/comments
 * Body: { targetUserId, imageIndex, imageUrl, content }
 *
 * The backend will:
 *  1. Save the comment
 *  2. Push a notification to the target user (in-app + push)
 *  3. Return the saved comment
 */
const sendPhotoComment = async ({ targetUserId, imageIndex, imageUrl, content }) => {
  const response = await apiClient.post("/comments", {
    targetUserId,
    imageIndex,
    imageUrl,
    content,
  });
  return response.data?.data ?? response.data;
};

/**
 * Get all comments the current user received on their photos.
 * Used to populate the inbox / notification detail screen.
 *
 * GET /api/comments/received
 */
const getReceivedComments = async () => {
  const response = await apiClient.get("/comments/received");
  return response.data?.data ?? [];
};

/**
 * Get comments the current user sent.
 *
 * GET /api/comments/sent
 */
const getSentComments = async () => {
  const response = await apiClient.get("/comments/sent");
  return response.data?.data ?? [];
};

export const commentService = {
  sendPhotoComment,
  getReceivedComments,
  getSentComments,
};