import apiClient from "../utils/axiosInstance";

const getMessages = async (matchId, options = {}) => {
  try {
    const response = await apiClient.get(`/messages/${matchId}`, {
      params: options,
    });
    const payload = response.data?.data ?? response.data;
    return payload?.messages ?? [];
  } catch (error) {
    throw (
      error.response?.data?.message || error.message || "Failed to load messages"
    );
  }
};

const sendMessage = async (matchId, payload) => {
  try {
    const response = await apiClient.post(`/messages/${matchId}`, payload);
    const data = response.data?.data ?? response.data;
    return data?.message ?? data;
  } catch (error) {
    throw (
      error.response?.data?.message || error.message || "Failed to send message"
    );
  }
};

const deleteMessage = async (messageId) => {
  try {
    const response = await apiClient.delete(`/messages/${messageId}`);
    return response.data;
  } catch (error) {
    throw (
      error.response?.data?.message ||
      error.message ||
      "Failed to delete message"
    );
  }
};

export const messageService = {
  getMessages,
  sendMessage,
  deleteMessage,
};
