/**
 * settingsService.js
 * Handles all /api/settings endpoints.
 */

import apiClient from "../utils/axiosInstance";

const SettingsService = {
  // ─── Phone ──────────────────────────────────────────────────

  /**
   * Initiate a phone number change — sends an OTP to the new number.
   * @param {{ phoneNumber: string, countryCode: string }} data
   */
  updatePhoneNumber: async (data) => {
    const response = await apiClient.patch("/api/settings/phone", data);
    return response.data;
  },

  /**
   * Confirm the phone change by submitting the received OTP.
   * @param {{ otp: string }} data
   */
  verifyPhoneUpdate: async (data) => {
    const response = await apiClient.post("/api/settings/phone/verify", data);
    return response.data;
  },

  // ─── Email ───────────────────────────────────────────────────

  /**
   * Initiate an email change — sends an OTP to the new address.
   * @param {{ email: string }} data
   */
  updateEmail: async (data) => {
    const response = await apiClient.patch("/api/settings/email", data);
    return response.data;
  },

  /**
   * Confirm the email change by submitting the received OTP.
   * @param {{ otp: string }} data
   */
  verifyEmailUpdate: async (data) => {
    const response = await apiClient.post("/api/settings/email/verify", data);
    return response.data;
  },

  // ─── Notification Settings ───────────────────────────────────

  /**
   * Fetch the user's saved notification preferences.
   * @returns {{ newMatch, newMessage, newLike, superLike, eventReminder,
   *             emailNotifications, pushNotifications, marketingEmails }}
   */
  getNotificationSettings: async () => {
    const response = await apiClient.get("/api/settings/notifications");
    return response.data;
  },

  /**
   * Update one or more notification preferences.
   * Only pass the booleans you want to change.
   * @param {{
   *   newMatch?: boolean, newMessage?: boolean, newLike?: boolean,
   *   superLike?: boolean, eventReminder?: boolean,
   *   emailNotifications?: boolean, pushNotifications?: boolean,
   *   marketingEmails?: boolean
   * }} data
   */
  updateNotificationSettings: async (data) => {
    const response = await apiClient.patch("/api/settings/notifications", data);
    return response.data;
  },

  // ─── Privacy Settings ────────────────────────────────────────

  /**
   * Fetch the user's saved privacy settings.
   * @returns {{ profileVisibility, showLastActive, showDistance,
   *             showAge, showOnlineStatus, allowMessageFromNonMatches }}
   */
  getPrivacySettings: async () => {
    const response = await apiClient.get("/api/settings/privacy");
    return response.data;
  },

  /**
   * Update one or more privacy settings.
   * @param {{
   *   profileVisibility?: 'everyone' | 'matches_only' | 'nobody',
   *   showLastActive?: boolean, showDistance?: boolean,
   *   showAge?: boolean, showOnlineStatus?: boolean,
   *   allowMessageFromNonMatches?: boolean
   * }} data
   */
  updatePrivacySettings: async (data) => {
    const response = await apiClient.patch("/api/settings/privacy", data);
    return response.data;
  },

  // ─── Block / Unblock ─────────────────────────────────────────

  /**
   * Block a user.
   * @param {string} userId
   * @param {{
   *   reason?: 'harassment'|'spam'|'inappropriate_content'|'fake_profile'|'other',
   *   notes?: string
   * }} data
   */
  blockUser: async (userId, data = {}) => {
    const response = await apiClient.post(`/api/settings/block/${userId}`, data);
    return response.data;
  },

  /**
   * Unblock a previously blocked user.
   * @param {string} userId
   */
  unblockUser: async (userId) => {
    const response = await apiClient.delete(`/api/settings/block/${userId}`);
    return response.data;
  },

  /**
   * Get the paginated list of users blocked by the current user.
   * @param {{ page?: number, limit?: number }} params
   */
  getBlockedUsers: async (params = {}) => {
    const response = await apiClient.get("/api/settings/blocked-users", { params });
    return response.data;
  },

  // ─── Delete Account ──────────────────────────────────────────

  /**
   * Permanently delete the account (requires current password).
   * @param {{ password: string, reason?: string }} data
   */
  deleteAccount: async (data) => {
    const response = await apiClient.delete("/api/settings/account", { data });
    return response.data;
  },

  // ─── Referral Code ───────────────────────────────────────────

  /**
   * Get (or lazily generate) the user's unique referral code.
   * @returns {{ referralCode: string, referralCount: number, referralLink: string }}
   */
  getReferralCode: async () => {
    const response = await apiClient.get("/api/settings/referral-code");
    return response.data;
  },

  // ─── Push Token ──────────────────────────────────────────────

  /**
   * Register / refresh the device FCM / Expo push token.
   * Call this once on app start after notification permissions are granted.
   * @param {{ pushToken: string }} data
   */
  updatePushToken: async (data) => {
    const response = await apiClient.patch("/api/settings/push-token", data);
    return response.data;
  },
};

export default SettingsService;
