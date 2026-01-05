import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { authAPI } from "../services/authService";
import { tokenManager } from "../utils/tokenManager";

// ----------------------- Async Thunks -----------------------

// Signup (store onboarding token + pending contact info)
export const signup = createAsyncThunk(
  "auth/signup",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authAPI.signup(userData);

      console.log("📋 Signup response:", {
        hasOnboardingToken: !!response.data.onboardingToken,
        onboardingTokenLength: response.data.onboardingToken?.length,
      });

      // FIXED: Only pass onboardingToken here
      await tokenManager.setToken({
        onboardingToken: response.data.onboardingToken,
      });

      return {
        ...response.data,
        email: userData.email || null,
        phoneNumber: userData.phoneNumber || null,
        countryCode: userData.countryCode || null,
      };
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || "Signup failed";
      return rejectWithValue(message);
    }
  }
);

// Verify OTP - CRITICAL FIX
export const verifyOtp = createAsyncThunk(
  "auth/verifyOtp",
  async (otpData, { rejectWithValue }) => {
    try {
      const response = await authAPI.verifyOtp(otpData);
      
      console.log("📋 Verify OTP response:", {
        hasToken: !!response.data.token,
        hasOnboardingToken: !!response.data.onboardingToken,
        tokenLength: response.data.token?.length,
        onboardingTokenLength: response.data.onboardingToken?.length,
        fullResponse: response.data,
      });

      // FIXED: Pass BOTH tokens properly
      await tokenManager.setToken({
        token: response.data.token, // Main auth token
        onboardingToken: response.data.onboardingToken, // Onboarding flow token
      });

      // Debug after setting
      await tokenManager.debugAllStoredValues();

      return response.data;
    } catch (error) {
      console.error("❌ Verify OTP error:", error);
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Resend OTP
export const resendOtp = createAsyncThunk(
  "auth/resendOtp",
  async (otpData, { rejectWithValue }) => {
    try {
      const response = await authAPI.resendOtp(otpData);

      console.log("📋 Resend OTP response:", {
        hasOnboardingToken: !!response.data.onboardingToken,
      });

      // FIXED: Only pass onboardingToken
      await tokenManager.setToken({
        onboardingToken: response.data.onboardingToken,
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Restore Auth with debugging
export const restoreAuth = createAsyncThunk(
  "auth/restoreAuth",
  async (_, { rejectWithValue }) => {
    try {
      console.log("🔄 restoreAuth: Starting token restoration...");
      
      // Debug all stored values first
      await tokenManager.debugAllStoredValues();
      
      const token = await tokenManager.getToken();
      const onboardingToken = await tokenManager.getOnboardingToken();
      
      console.log("🔄 restoreAuth results:", {
        token: token ? `Found (${token.length} chars)` : "NULL",
        onboardingToken: onboardingToken ? `Found (${onboardingToken.length} chars)` : "NULL",
        isAuthenticated: !!token,
        hasOnboardingSession: !!onboardingToken,
      });

      return {
        token,
        onboardingToken,
        isAuthenticated: Boolean(token),
        hasOnboardingSession: Boolean(onboardingToken),
      };
    } catch (error) {
      console.error("❌ restoreAuth error:", error);
      return rejectWithValue("Failed to restore authentication");
    }
  }
);

// ----------------------- Slice -----------------------

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    token: null,
    onboardingToken: null,

    pendingEmail: null,
    pendingPhoneNumber: null,
    pendingCountryCode: null,

    loading: false,
    authLoading: true,

    isAuthenticated: false,
    hasOnboardingSession: false,
    authRestored: false,

    error: null,
  },

  reducers: {
    setAuthLoading: (state, action) => {
      state.authLoading = action.payload;
    },
    clearOnboardingToken: (state) => {
      state.onboardingToken = null;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.onboardingToken = null;

      state.pendingEmail = null;
      state.pendingPhoneNumber = null;
      state.pendingCountryCode = null;

      state.isAuthenticated = false;
      state.hasOnboardingSession = false;

      tokenManager.removeTokens(); // updated
    },

    clearError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      // ---------------- Signup ----------------
      .addCase(signup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signup.fulfilled, (state, action) => {
        state.loading = false;
        state.onboardingToken = action.payload.onboardingToken;
        state.hasOnboardingSession = true;

        state.pendingEmail = action.payload.email;
        state.pendingPhoneNumber = action.payload.phoneNumber;
        state.pendingCountryCode = action.payload.countryCode;
      })
      .addCase(signup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ---------------- Verify OTP ----------------
      .addCase(verifyOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.loading = false;

        state.token = action.payload.token || null;
        state.onboardingToken = action.payload.onboardingToken || null;

        state.isAuthenticated = Boolean(action.payload.token);
        state.hasOnboardingSession = Boolean(action.payload.onboardingToken);

        state.pendingEmail = null;
        state.pendingPhoneNumber = null;
        state.pendingCountryCode = null;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ---------------- Resend OTP ----------------
      .addCase(resendOtp.fulfilled, (state, action) => {
        if (action.payload.onboardingToken) {
          state.onboardingToken = action.payload.onboardingToken;
          state.hasOnboardingSession = true;
        }
      })

      // ---------------- Login ----------------
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.user = action.payload.user;

        state.isAuthenticated = true;
        state.hasOnboardingSession = false;
      })

      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ---------------- Restore Auth ----------------
      .addCase(restoreAuth.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.onboardingToken = action.payload.onboardingToken;

        state.isAuthenticated = action.payload.isAuthenticated;
        state.hasOnboardingSession = action.payload.hasOnboardingSession;

        state.authRestored = true;
        state.authLoading = false;
      })
      .addCase(restoreAuth.rejected, (state) => {
        state.authRestored = true;
        state.authLoading = false;
      });
  },
});

export const { logout, clearError, setAuthLoading, clearOnboardingToken } =
  authSlice.actions;
export default authSlice.reducer;
