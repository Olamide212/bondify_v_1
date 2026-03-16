import AsyncStorage from "@react-native-async-storage/async-storage";
import apiClient from "../utils/axiosInstance";

const AUTH_ME_CACHE_KEY = "@bondify/cache/auth/me";
let cachedMe = null;

const safeParse = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const isNetworkLikeError = (error) => {
  if (!error?.response) return true;
  return false;
};

const writeCachedMe = async (user) => {
  if (!user) return;

  cachedMe = user;
  try {
    await AsyncStorage.setItem(
      AUTH_ME_CACHE_KEY,
      JSON.stringify({
        value: user,
        updatedAt: Date.now(),
      })
    );
  } catch (error) {
    console.warn("Failed to persist auth me cache:", error?.message || error);
  }
};

const readCachedMe = async () => {
  if (cachedMe) return cachedMe;

  try {
    const raw = await AsyncStorage.getItem(AUTH_ME_CACHE_KEY);
    if (!raw) return null;
    const parsed = safeParse(raw);
    const user = parsed?.value ?? null;
    cachedMe = user;
    return user;
  } catch (error) {
    console.warn("Failed to read auth me cache:", error?.message || error);
    return null;
  }
};

const maybeCacheUserFromResponse = async (response) => {
  const payload = response?.data?.data ?? response?.data;
  const user = payload?.user;
  if (user) {
    await writeCachedMe(user);
  }
};

// API service functions
export const authAPI = {
  signup: async (userData) => {
    const response = await apiClient.post("/auth/signup", userData, { skipAuth: true });
    await maybeCacheUserFromResponse(response);
    return response;
  },
  verifyOtp: async (data) => {
    const response = await apiClient.post("/auth/verify-otp", data, { skipAuth: true });
    await maybeCacheUserFromResponse(response);
    return response;
  },
  login: async (credentials) => {
    const response = await apiClient.post("/auth/login", credentials, { skipAuth: true });
    await maybeCacheUserFromResponse(response);
    return response;
  },
  resendOtp: (data) => apiClient.post("/auth/resend-otp", data, { skipAuth: true }),
  forgotPassword: (data) => apiClient.post("/auth/forgot-password", data, { skipAuth: true }),
  verifyForgotPasswordOtp: (data) => apiClient.post("/auth/verify-forgot-password-otp", data, { skipAuth: true }),
  resetPassword: (data) => apiClient.post("/auth/reset-password", data, { skipAuth: true }),
  getMe: async () => {
    try {
      const response = await apiClient.get("/auth/me");
      await maybeCacheUserFromResponse(response);
      return response;
    } catch (error) {
      if (isNetworkLikeError(error)) {
        const cachedUser = await readCachedMe();
        if (cachedUser) {
          return {
            data: {
              data: {
                user: cachedUser,
              },
            },
          };
        }
      }
      throw error;
    }
  },
};
