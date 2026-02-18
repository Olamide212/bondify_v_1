import apiClient from "../utils/axiosInstance"; // your axios instance

const updateProfile = async (fields) => {
  try {
    const response = await apiClient.patch("/profile", fields);
    return response.data?.data?.user ?? response.data?.data ?? response.data;
  } catch (err) {
    throw err.response?.data?.message || err.message || "Profile update failed";
  }
};

const completeOnboarding = async () => {
  try {
    const response = await apiClient.post("/profile/complete-onboarding");
    return response.data?.data?.user ?? response.data?.data ?? response.data;
  } catch (err) {
    throw (
      err.response?.data?.message || err.message || "Complete onboarding failed"
    );
  }
};

const getLookups = async (type) => {
  try {
    const response = await apiClient.get(`/lookup?type=${type}`);
    return response.data?.data?.lookups ?? response.data?.data ?? [];
  } catch (err) {
    throw (
      err.response?.data?.message || err.message || "Failed to fetch lookups"
    );
  }
};

export const profileService = {
  updateProfile,
  completeOnboarding,
  getLookups,
};
