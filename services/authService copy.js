// /**
//  * authService.js
//  * Handles all /api/auth endpoints.
//  */

// import apiClient from "./axiosInstance";
// import { tokenManager } from "./tokenManager";

// const AuthService = {
//   /**
//    * Register a new user.
//    * @param {{ firstName, lastName, email, password, phoneNumber, countryCode, referralCode? }} data
//    */
//   signup: async (data) => {
//     const response = await apiClient.post("/api/auth/signup", data);
//     const { onboardingToken } = response.data?.data ?? {};
//     if (onboardingToken) await tokenManager.saveToken(onboardingToken);
//     return response.data;
//   },

//   /**
//    * Verify OTP sent at signup.
//    * @param {{ email: string, otp: string }} data
//    */
//   verifyOtp: async (data) => {
//     const response = await apiClient.post("/api/auth/verify-otp", data);
//     const { token } = response.data?.data ?? {};
//     if (token) await tokenManager.saveToken(token);
//     return response.data;
//   },

//   /**
//    * Resend OTP to the given email.
//    * @param {{ email: string }} data
//    */
//   resendOtp: async (data) => {
//     const response = await apiClient.post("/api/auth/resend-otp", data);
//     return response.data;
//   },

//   /**
//    * Log in an existing verified user.
//    * @param {{ email: string, password: string }} data
//    */
//   login: async (data) => {
//     const response = await apiClient.post("/api/auth/login", data);
//     const { token } = response.data?.data ?? {};
//     if (token) await tokenManager.saveToken(token);
//     return response.data;
//   },

//   /**
//    * Get the currently authenticated user.
//    */
//   getMe: async () => {
//     const response = await apiClient.get("/api/auth/me");
//     return response.data;
//   },

//   /**
//    * Clear the local token and log out.
//    */
//   logout: async () => {
//     await tokenManager.removeToken();
//   },
// };

// export default AuthService;
