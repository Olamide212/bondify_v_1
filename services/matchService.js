import apiClient from "../utils/axiosInstance";

const getMatches = async (options = {}) => {
  try {
    const response = await apiClient.get("/matches", { params: options });
    const payload = response.data?.data ?? response.data;
    return payload?.matches ?? [];
  } catch (error) {
    throw (
      error.response?.data?.message || error.message || "Failed to load matches"
    );
  }
};

export const matchService = {
  getMatches,
};
