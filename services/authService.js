import apiClient from "../utils/axiosInstance";


// API service functions
export const authAPI = {
  signup: (userData) => apiClient.post("/auth/signup", userData, { skipAuth: true }),
  verifyOtp: (data) => apiClient.post("/auth/verify-otp", data, { skipAuth: true }),
  login: (credentials) => apiClient.post("/auth/login", credentials, { skipAuth: true }),
  resendOtp: (data) => apiClient.post("/auth/resend-otp", data, { skipAuth: true }),
  getMe: () => apiClient.get("/auth/me"),
};
