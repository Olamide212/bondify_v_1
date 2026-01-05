import * as SecureStore from "expo-secure-store";

export const tokenManager = {
  setToken: async ({ token, onboardingToken }) => {
    try {
      // 🔐 Main auth token
      if (token !== undefined && token !== null) {
        const tokenValue =
          typeof token === "string" ? token : JSON.stringify(token);

        await SecureStore.setItemAsync("token", tokenValue);
      } else {
        await SecureStore.deleteItemAsync("token");
      }

      // 🔐 Onboarding token
      if (onboardingToken !== undefined && onboardingToken !== null) {
        const onboardingValue =
          typeof onboardingToken === "string"
            ? onboardingToken
            : JSON.stringify(onboardingToken);

        await SecureStore.setItemAsync("onboardingToken", onboardingValue);
      } else {
        await SecureStore.deleteItemAsync("onboardingToken");
      }
    } catch (error) {
      console.error("Error setting tokens:", error);
    }
  },

  getToken: async () => {
    try {
      const value = await SecureStore.getItemAsync("token");
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error("Error getting token:", error);
      return null;
    }
  },

  getOnboardingToken: async () => {
    try {
      const value = await SecureStore.getItemAsync("onboardingToken");
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error("Error getting onboarding token:", error);
      return null;
    }
  },

  removeToken: async () => {
    try {
      await SecureStore.deleteItemAsync("token");
      await SecureStore.deleteItemAsync("onboardingToken");
    } catch (error) {
      console.error("Error removing tokens:", error);
    }
  },
};
