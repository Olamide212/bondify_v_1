import AsyncStorage from "@react-native-async-storage/async-storage";

export const tokenManager = {
  setToken: async ({ token, onboardingToken }) => {
    try {
      if (token !== undefined && token !== null) {
        // stringify if it's an object
        const tokenValue =
          typeof token === "string" ? token : JSON.stringify(token);
        await AsyncStorage.setItem("token", tokenValue);
      } else {
        await AsyncStorage.removeItem("token");
      }

      if (onboardingToken !== undefined && onboardingToken !== null) {
        const onboardingValue =
          typeof onboardingToken === "string"
            ? onboardingToken
            : JSON.stringify(onboardingToken);
        await AsyncStorage.setItem("onboardingToken", onboardingValue);
      } else {
        await AsyncStorage.removeItem("onboardingToken");
      }
    } catch (error) {
      console.error("Error setting tokens:", error);
    }
  },

  getToken: async () => {
    try {
      const value = await AsyncStorage.getItem("token");
      return value ? JSON.parse(value) : null; // parse back to object if needed
    } catch (error) {
      console.error("Error getting token:", error);
      return null;
    }
  },

  getOnboardingToken: async () => {
    try {
      const value = await AsyncStorage.getItem("onboardingToken");
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error("Error getting onboarding token:", error);
      return null;
    }
  },

  removeToken: async () => {
    try {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("onboardingToken");
    } catch (error) {
      console.error("Error removing tokens:", error);
    }
  },
};
