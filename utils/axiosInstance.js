import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Base URL for your API
const BASE_URL = "https://bondify-backend.onrender.com/api"; // Replace with your actual API URL

// Create axios instance
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Token management functions
export const tokenManager = {
  getToken: async () => {
    try {
      return await AsyncStorage.getItem("onboardingToken");
    } catch (error) {
      console.error("Error getting token:", error);
      return null;
    }
  },

  setToken: async (token) => {
    try {
      await AsyncStorage.setItem("onboardingToken", token);
    } catch (error) {
      console.error("Error setting token:", error);
    }
  },

  removeToken: async () => {
    try {
      await AsyncStorage.removeItem("onboardingToken");
    } catch (error) {
      console.error("Error removing token:", error);
    }
  },
};

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await tokenManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle token expiration (401)
    if (error.response?.status === 401) {
      tokenManager.removeToken();
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
