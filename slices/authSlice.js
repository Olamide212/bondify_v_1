import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { authAPI } from "../services/authService";
import { tokenManager } from "../utils/axiosInstance";

/* =====================
   Async thunks
===================== */

export const signup = createAsyncThunk(
  "auth/signup",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authAPI.signup(userData);
      await tokenManager.setToken(response.data.onboardingToken);

      return {
        ...response.data,
        email: userData.email, // ✅ keep email for OTP
      };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Signup failed";
      return rejectWithValue(message);
    }
  }
);

export const loginOtp = createAsyncThunk(
  "auth/loginOtp",
  async (email, { rejectWithValue }) => {
    try {
      const response = await authAPI.loginOtp({ email });
      return { ...response.data, email };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.response?.data?.error ||
          error.message
      );
    }
  }
);

export const verifyOtp = createAsyncThunk(
  "auth/verifyOtp",
  async (otpData, { rejectWithValue }) => {
    try {
      const response = await authAPI.verifyOtp(otpData);
      await tokenManager.setToken(response.data.token);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const resendOtp = createAsyncThunk(
  "auth/resendOtp",
  async (otpData, { rejectWithValue }) => {
    try {
      const response = await authAPI.resendOtp(otpData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const login = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(credentials);
      await tokenManager.setToken(response.data.token);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/* =====================
   Auth slice
===================== */

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    token: null,
    pendingEmail: null, // ✅ added
    loading: false,
    error: null,
    isAuthenticated: false,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.pendingEmail = null; // ✅ clear
      state.isAuthenticated = false;
      tokenManager.removeToken();
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder

      // Signup
      .addCase(signup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signup.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.onboardingToken;
        state.pendingEmail = action.payload.email; // ✅ store email
      })
      .addCase(signup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Login OTP
      .addCase(loginOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingEmail = action.payload.email; // ✅ store email
      })
      .addCase(loginOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Verify OTP
      .addCase(verifyOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user || null;
        state.isAuthenticated = true;
        state.pendingEmail = null; // ✅ clear after success
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Resend OTP
      .addCase(resendOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resendOtp.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(resendOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Login (password-based fallback)
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
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
