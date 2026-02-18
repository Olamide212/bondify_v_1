import apiClient from "../utils/axiosInstance";


// API service functions
export const authAPI = {
  signup: (userData) => apiClient.post("/auth/signup", userData),
  verifyOtp: (data) => apiClient.post("/auth/verify-otp", data),
  login: (credentials) => apiClient.post("/auth/login", credentials),
  resendOtp: (data) => apiClient.post("/auth/resend-otp", data),
  getMe: () => apiClient.get("/auth/me"),
};
