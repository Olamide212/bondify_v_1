/**
 * notificationService.js
 * Handles all /api/notifications endpoints.
 */

import apiClient from "../utils/axiosInstance";

/** Map each notification type to a display label and emoji icon. */
export const NOTIFICATION_META = {
  new_match:               { label: "New Match",              icon: "💞", category: "match" },
  new_message:             { label: "New Message",            icon: "💬", category: "message" },
  new_like:                { label: "Someone Liked You",      icon: "❤️", category: "activity" },
  super_like:              { label: "Super Like!",            icon: "⭐", category: "activity" },
  photo_like:              { label: "Photo Liked",            icon: "❤️", category: "activity" },
  photo_comment:           { label: "Photo Comment",          icon: "💬", category: "activity" },
  profile_visit:           { label: "Profile Visit",          icon: "👀", category: "activity" },
  event_invite:            { label: "Event Invite",           icon: "🎉", category: "activity" },
  event_reminder:          { label: "Event Reminder",         icon: "📅", category: "activity" },
  premium_expiry:          { label: "Premium Expiring Soon",  icon: "💎", category: "system" },
  verification_approved:   { label: "Identity Verified",      icon: "✅", category: "system" },
  verification_rejected:   { label: "Verification Rejected",  icon: "❌", category: "system" },
  referral_joined:         { label: "Referral Joined",        icon: "🔗", category: "system" },
  ai_tip:                  { label: "AI Assistant",           icon: "✨", category: "system" },
  profile_incomplete:      { label: "Profile Update",         icon: "📝", category: "system" },
  system:                  { label: "Bondies",                icon: "🔔", category: "system" },
};

const NotificationService = {
  /**
   * Fetch the current user's notifications, newest first.
   * @param {{ page?: number, limit?: number }} params
   * @returns {{ data: Notification[], unreadCount: number, pagination }}
   */
  getNotifications: async (params = {}) => {
    const response = await apiClient.get("/notifications", { params });
    return response.data;
  },

  /**
   * Lightweight call — returns only the unread count (useful for tab badges).
   * @returns {number}
   */
  getUnreadCount: async () => {
    const response = await apiClient.get("/notifications", {
      params: { page: 1, limit: 1 },
    });
    return response.data?.unreadCount ?? 0;
  },

  /**
   * Mark a single notification as read.
   * Call this when the user taps a notification row.
   * @param {string} notificationId
   */
  markAsRead: async (notificationId) => {
    const response = await apiClient.patch(
      `/notifications/${notificationId}/read`
    );
    return response.data;
  },

  /**
   * Mark every unread notification as read in one call.
   * Call this when the user opens the notifications screen.
   */
  markAllAsRead: async () => {
    const response = await apiClient.patch("/notifications/read-all");
    return response.data;
  },

  /**
   * Delete a notification.
   * @param {string} notificationId
   */
  deleteNotification: async (notificationId) => {
    const response = await apiClient.delete(
      `/notifications/${notificationId}`
    );
    return response.data;
  },
};

export default NotificationService;
