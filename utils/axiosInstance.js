import axios from "axios";
import Constants from "expo-constants";
import { tokenManager } from "./tokenManager";


// In dev mode, replace localhost/127.0.0.1 with the dev machine's actual IP
// so that real devices (running Expo Go) can reach the backend server.
const resolveBaseUrl = (url) => {
  if (__DEV__ && url) {
    const hostUri =
      Constants.expoConfig?.hostUri ?? Constants.manifest?.debuggerHost;
    if (hostUri) {
      const devHost = hostUri.split(":")[0];
      if (devHost) {
        return url.replace(/localhost|127\.0\.0\.1/g, devHost);
      }
    }
  }
  return url;
};

// Base URL for your API
const BASE_URL = resolveBaseUrl(
  (__DEV__
    ? process.env.EXPO_PUBLIC_DEV_API_BASE_URL
    : process.env.EXPO_PUBLIC_PROD_API_BASE_URL) ||
    process.env.EXPO_PUBLIC_DEV_API_BASE_URL
);

if (__DEV__) {
  console.log("🌐 API Base URL:", BASE_URL);
}

// Create axios instance
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
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
    // Log network errors with useful debugging info
    if (!error.response) {
      console.error("❌ Network Error:", {
        message: error.message,
        url: `${error.config?.baseURL ?? ""}${error.config?.url ?? ""}`,
        hint: "If on a real device, ensure the backend is reachable at the URL above.",
      });
    }

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
