import axiosInstance from "../utils/axiosInstance";

export const getDiscoveryProfiles = async (params = {}) => {
  const response = await axiosInstance.get("/discover", { params });
  return response.data?.profiles || response.data || [];
};

export const performSwipeAction = async (likedUserId, type) => {
  const response = await axiosInstance.post("/discover/action", {
    likedUserId,
    type,
  });
  return response.data;
};

export const rewindPass = async () => {
  const response = await axiosInstance.post("/discover/rewind");
  return response.data;
};
