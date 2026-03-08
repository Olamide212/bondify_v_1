import axiosInstance from "../utils/axiosInstance";

export const getDiscoveryProfiles = async (params = {}) => {
  const response = await axiosInstance.get("/discover", { params });
  return response.data?.profiles || response.data || [];
};
