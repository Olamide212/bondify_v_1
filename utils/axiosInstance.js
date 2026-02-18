import axios from "axios";
import { tokenManager } from "./tokenManager";


// Base URL for your API
const BASE_URL =
  (__DEV__
    ? process.env.EXPO_PUBLIC_DEV_API_BASE_URL
    : process.env.EXPO_PUBLIC_PROD_API_BASE_URL) ||
  process.env.EXPO_PUBLIC_DEV_API_BASE_URL;

// Create axios instance
const apiClient = axios.create({
  baseURL: BASE_URL,
  // timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});


// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    // allow public endpoints
    if (config.skipAuth) return config;

    const token = await tokenManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle token expiration (401)
    if (error.response?.status === 401) {
      tokenManager.removeTokens();
      // You might want to navigate to login screen here
      // navigationRef.navigate('Login');
    }

    // Handle other common errors
    if (error.response?.status === 403) {
      console.error("Access forbidden");
    } else if (error.response?.status === 404) {
      console.error("Resource not found");
    } else if (error.response?.status >= 500) {
      console.error("Server error occurred");
    }

    return Promise.reject(error);
  }
);



export default apiClient;
