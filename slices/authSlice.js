import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { authAPI } from "../services/authService";
import { tokenManager } from "../utils/tokenManager";

// ----------------------- Async Thunks -----------------------

// Signup (store onboarding token + pending contact info)
export const signup = createAsyncThunk(
  "auth/signup",
  async (userData, { rejectWithValue }) => {
    try {
      const name = [userData.firstName, userData.lastName]
        .filter(Boolean)
        .join(" ")
        .trim();

      const response = await authAPI.signup({
        email: userData.email,
        password: userData.password,
        phoneNumber: userData.phoneNumber || userData.phone,
        countryCode: userData.countryCode,
        ...(name ? { name } : {}),
      });

      const data = response.data?.data || {};

      console.log("📋 Signup response:", {
        hasOnboardingToken: !!data.onboardingToken,
        onboardingTokenLength: data.onboardingToken?.length,
      });

      // FIXED: Only pass onboardingToken here
      await tokenManager.setToken({
        onboardingToken: data.onboardingToken,
      });

      return {
        ...data,
        message: response.data?.message,
        email: userData.email || data.email || null,
        phoneNumber: userData.phoneNumber || userData.phone || null,
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
      const response = await authAPI.verifyOtp({
        email: otpData.email,
        otp: otpData.otp || otpData.code,
      });
      const data = response.data?.data || {};
      
      console.log("📋 Verify OTP response:", {
        hasToken: !!data.token,
        hasOnboardingToken: !!data.onboardingToken,
        tokenLength: data.token?.length,
        onboardingTokenLength: data.onboardingToken?.length,
        fullResponse: response.data,
      });

      // FIXED: Pass BOTH tokens properly
      await tokenManager.setToken({
        token: data.token, // Main auth token
        onboardingToken: data.onboardingToken, // Onboarding flow token
      });

      // Debug after setting
      await tokenManager.debugAllStoredValues();

      return { ...data, message: response.data?.message };
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
      const response = await authAPI.resendOtp({ email: otpData.email });

      console.log("📋 Resend OTP response:", {
        message: response.data?.message,
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Login
export const login = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(credentials);
      const data = response.data?.data || {};

      await tokenManager.setToken({
        token: data.token,
        onboardingToken: data.onboardingToken,
      });

      return { ...data, message: response.data?.message };
    } catch (error) {
      const payload = error.response?.data;
      if (payload?.requiresVerification) {
        return rejectWithValue({
          message: payload.message,
          requiresVerification: true,
          email: credentials?.email,
        });
      }

      return rejectWithValue(payload?.message || error.message);
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
      let user = null;

      if (token) {
        try {
          const response = await authAPI.getMe();
          const payload = response.data?.data ?? response.data;
          user = payload?.user ?? payload ?? null;
        } catch (error) {
          await tokenManager.removeTokens();
          return {
            token: null,
            onboardingToken: null,
            user: null,
            isAuthenticated: false,
            hasOnboardingSession: false,
          };
        }
      }

      console.log("🔄 restoreAuth results:", {
        token: token ? `Found (${token.length} chars)` : "NULL",
        onboardingToken: onboardingToken ? `Found (${onboardingToken.length} chars)` : "NULL",
        isAuthenticated: !!token,
        hasOnboardingSession: !!onboardingToken,
      });

      return {
        token,
        onboardingToken,
        user,
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
    authLoading: false,

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
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.onboardingToken = action.payload.onboardingToken || null;

        state.isAuthenticated = true;
        state.hasOnboardingSession = Boolean(action.payload.onboardingToken);
      })

      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        if (action.payload?.requiresVerification) {
          state.pendingEmail = action.payload.email || null;
        }
        state.error = action.payload?.message || action.payload;
      })

      // ---------------- Restore Auth ----------------
      .addCase(restoreAuth.pending, (state) => {
        state.authLoading = true;
        state.error = null;
      })
      .addCase(restoreAuth.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.onboardingToken = action.payload.onboardingToken;
        state.user = action.payload.user || null;

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
