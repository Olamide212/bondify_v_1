import * as SecureStore from "expo-secure-store";

const AUTH_TOKEN_KEY = "token"; 
const ONBOARDING_TOKEN_KEY = "onboardingToken";
const PENDING_EMAIL_KEY = "pendingVerificationEmail";
const PENDING_PHONE_KEY = "pendingVerificationPhone";
const PENDING_COUNTRY_CODE_KEY = "pendingCountryCode";

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
      } else if (token === null) {
        await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
        console.log("🗑️ Auth token removed from SecureStore");
      }

      if (onboardingToken) {
        await SecureStore.setItemAsync(ONBOARDING_TOKEN_KEY, onboardingToken);
        console.log("✅ Onboarding token saved to SecureStore");
        
        // Verify it was saved
        const savedOnboardingToken = await SecureStore.getItemAsync(ONBOARDING_TOKEN_KEY);
        console.log("🔍 Verification - Saved onboarding token exists:", !!savedOnboardingToken);
      } else if (onboardingToken === null) {
        await SecureStore.deleteItemAsync(ONBOARDING_TOKEN_KEY);
        console.log("🗑️ Onboarding token removed from SecureStore");
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
  // Pending verification email persistence
  // -----------------------------------
  setPendingVerification: async ({ email, phoneNumber, countryCode }) => {
    try {
      console.log("📝 Saving pending verification:", { email, phoneNumber });
      if (email) {
        await SecureStore.setItemAsync(PENDING_EMAIL_KEY, email);
      }
      if (phoneNumber) {
        await SecureStore.setItemAsync(PENDING_PHONE_KEY, phoneNumber);
      }
      if (countryCode) {
        await SecureStore.setItemAsync(PENDING_COUNTRY_CODE_KEY, countryCode);
      }
      console.log("✅ Pending verification info saved");
    } catch (error) {
      console.error("❌ Error saving pending verification:", error);
    }
  },

  getPendingVerification: async () => {
    try {
      const email = await SecureStore.getItemAsync(PENDING_EMAIL_KEY);
      const phoneNumber = await SecureStore.getItemAsync(PENDING_PHONE_KEY);
      const countryCode = await SecureStore.getItemAsync(PENDING_COUNTRY_CODE_KEY);
      console.log("📧 Retrieved pending verification:", { email: !!email, phone: !!phoneNumber });
      return { email, phoneNumber, countryCode };
    } catch (error) {
      console.error("Error getting pending verification:", error);
      return { email: null, phoneNumber: null, countryCode: null };
    }
  },

  clearPendingVerification: async () => {
    try {
      await SecureStore.deleteItemAsync(PENDING_EMAIL_KEY);
      await SecureStore.deleteItemAsync(PENDING_PHONE_KEY);
      await SecureStore.deleteItemAsync(PENDING_COUNTRY_CODE_KEY);
      console.log("🗑️ Pending verification info cleared");
    } catch (error) {
      console.error("Error clearing pending verification:", error);
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
      await SecureStore.deleteItemAsync("onboardingStep");
      await SecureStore.deleteItemAsync("onboardingComplete");
      await SecureStore.deleteItemAsync(PENDING_EMAIL_KEY);
      await SecureStore.deleteItemAsync(PENDING_PHONE_KEY);
      await SecureStore.deleteItemAsync(PENDING_COUNTRY_CODE_KEY);
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
