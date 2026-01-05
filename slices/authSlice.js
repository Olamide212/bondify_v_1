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

// Verify OTP
export const verifyOtp = createAsyncThunk(
  "auth/verifyOtp",
  async (otpData, { rejectWithValue }) => {
    try {
      const response = await authAPI.verifyOtp(otpData);

      await tokenManager.setToken({
        token: response.data.token,
        onboardingToken: response.data.onboardingToken,
      });

      return response.data;
    } catch (error) {
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

      await tokenManager.setToken({
        onboardingToken: response.data.onboardingToken,
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

      await tokenManager.setToken({ token: response.data.token });

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// ---------------- Restore Auth ----------------
export const restoreAuth = createAsyncThunk(
  "auth/restoreAuth",
  async (_, { rejectWithValue }) => {
    try {
      const token = await tokenManager.getToken();
      const onboardingToken = await tokenManager.getOnboardingToken();

      return {
        token,
        onboardingToken,
      };
    } catch (error) {
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

    loading: false, // API/UI loading
    authLoading: true, // 🔥 APP BOOTSTRAP FLAG
    error: null,

    isAuthenticated: false,
    authRestored: false,
  },

  reducers: {
    setAuthLoading: (state, action) => {
      state.authLoading = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.onboardingToken = null;
      state.pendingEmail = null;
      state.pendingPhoneNumber = null;
      state.pendingCountryCode = null;
      state.isAuthenticated = false;
      tokenManager.removeToken();
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

        // store pending contact info for OTP
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
        state.token = action.payload.token;
        state.onboardingToken = action.payload.onboardingToken || null;
        state.isAuthenticated = true;

        // clear pending data
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
        state.loading = false;
        state.onboardingToken =
          action.payload.onboardingToken || state.onboardingToken;
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
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ---------------- Restore Auth ----------------
      .addCase(restoreAuth.pending, (state) => {
        state.authLoading = true;
      })
      .addCase(restoreAuth.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.onboardingToken = action.payload.onboardingToken;

        state.isAuthenticated = Boolean(action.payload.token);

        state.authRestored = true;
        state.authLoading = false;
      })
      .addCase(restoreAuth.rejected, (state) => {
        state.authRestored = true;
        state.authLoading = false; 
      });

  },
});

export const { logout, clearError, setAuthLoading } = authSlice.actions;
export default authSlice.reducer;
