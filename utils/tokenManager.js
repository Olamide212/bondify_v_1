import * as SecureStore from "expo-secure-store";

const AUTH_TOKEN_KEY = "authToken"; // Changed from "token" for clarity
const ONBOARDING_TOKEN_KEY = "onboardingToken";

export const tokenManager = {
  // -----------------------------------
  // Save tokens with detailed logging
  // -----------------------------------
  setToken: async ({ token, onboardingToken }) => {
    try {
      console.log("📝 tokenManager.setToken called with:", {
        hasToken: !!token,
        hasOnboardingToken: !!onboardingToken,
        tokenLength: token?.length,
        onboardingTokenLength: onboardingToken?.length,
      });

      if (token) {
        await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
        console.log("✅ Auth token saved to SecureStore");
        
        // Verify it was saved
        const savedToken = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
        console.log("🔍 Verification - Saved auth token exists:", !!savedToken);
        if (savedToken !== token) {
          console.error("❌ Auth token mismatch after saving!");
        }
      }

      if (onboardingToken) {
        await SecureStore.setItemAsync(ONBOARDING_TOKEN_KEY, onboardingToken);
        console.log("✅ Onboarding token saved to SecureStore");
        
        // Verify it was saved
        const savedOnboardingToken = await SecureStore.getItemAsync(ONBOARDING_TOKEN_KEY);
        console.log("🔍 Verification - Saved onboarding token exists:", !!savedOnboardingToken);
      }
    } catch (error) {
      console.error("❌ Error setting tokens:", error);
    }
  },

  // -----------------------------------
  // Getters with logging
  // -----------------------------------
  getToken: async () => {
    try {
      const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      console.log("🔑 tokenManager.getToken ->", token ? `Found (${token.length} chars)` : "NULL");
      return token;
    } catch (error) {
      console.error("Error getting auth token:", error);
      return null;
    }
  },

  getOnboardingToken: async () => {
    try {
      const token = await SecureStore.getItemAsync(ONBOARDING_TOKEN_KEY);
      console.log("🔑 tokenManager.getOnboardingToken ->", token ? `Found (${token.length} chars)` : "NULL");
      return token;
    } catch (error) {
      console.error("Error getting onboarding token:", error);
      return null;
    }
  },

  // -----------------------------------
  // Debug function to check all stored values
  // -----------------------------------
  debugAllStoredValues: async () => {
    try {
      console.log("🔍 DEBUG - All SecureStore values:");
      const allKeys = ["authToken", "token", "onboardingToken", "onboardingStep"];
      
      for (const key of allKeys) {
        const value = await SecureStore.getItemAsync(key);
        console.log(`  ${key}: ${value ? `EXISTS (${value.length} chars)` : "NULL"}`);
      }
    } catch (error) {
      console.error("Error debugging SecureStore:", error);
    }
  },

  // -----------------------------------
  // Remove all tokens (logout)
  // -----------------------------------
  removeTokens: async () => {
    try {
      console.log("🗑️ Removing all tokens from SecureStore");
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(ONBOARDING_TOKEN_KEY);
      console.log("✅ All tokens removed");
    } catch (error) {
      console.error("Error removing tokens:", error);
    }
  },

  // -----------------------------------
  // 🔐 API helpers (MOST IMPORTANT)
  // -----------------------------------

  /**
   * For authenticated routes
   * → matches req.headers.authorization
   */
  getAuthHeader: async () => {
    const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);

    if (!token) return {};

    return {
      Authorization: `Bearer ${token}`,
    };
  },

  /**
   * For onboarding routes
   * → matches req.query.token
   */
  getOnboardingQuery: async () => {
    const token = await SecureStore.getItemAsync(ONBOARDING_TOKEN_KEY);
    return token ? { token } : {};
  },
};
