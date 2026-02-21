import apiClient from "../utils/axiosInstance"; // your axios instance

const updateProfile = async (fields) => {
  try {
    const response = await apiClient.patch("/profile", fields);
    const payload = response.data?.data ?? response.data;
    return payload?.user ?? payload;
  } catch (err) {
    throw err.response?.data?.message || err.message || "Profile update failed";
  }
};

const completeOnboarding = async () => {
  try {
    const response = await apiClient.post("/profile/complete-onboarding");
    const payload = response.data?.data ?? response.data;
    return payload?.user ?? payload;
  } catch (err) {
    throw (
      err.response?.data?.message || err.message || "Complete onboarding failed"
    );
  }
};

const getLookups = async (type) => {
  try {
    const response = await apiClient.get(`/lookup?type=${type}`);
    const payload = response.data?.data?.lookups ?? response.data?.lookups;
    return Array.isArray(payload) ? payload : [];
  } catch (err) {
    throw (
      err.response?.data?.message || err.message || "Failed to fetch lookups"
    );
  }
};

const getDiscoveryProfiles = async (params = {}) => {
  try {
    const response = await apiClient.get("/discover", { params });
    const payload = response.data?.data ?? response.data;
    return payload?.profiles ?? [];
  } catch (err) {
    const message =
      err.response?.data?.message ||
      err.message ||
      "Failed to fetch discovery profiles";
    throw new Error(message);
  }
};

const performSwipeAction = async ({ likedUserId, type }) => {
  try {
    const response = await apiClient.post("/discover/action", {
      likedUserId,
      type,
    });
    const payload = response.data?.data ?? response.data;
    return payload ?? {};
  } catch (err) {
    const message =
      err.response?.data?.message || err.message || "Failed to record swipe";
    throw new Error(message);
  }
};

export const profileService = {
  updateProfile,
  completeOnboarding,
  getLookups,
  getDiscoveryProfiles,
  performSwipeAction,
};
