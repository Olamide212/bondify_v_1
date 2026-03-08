/**
 * notificationService.js
 * Handles all /api/notifications endpoints.
 */

import apiClient from "../utils/axiosInstance";

/** Map each notification type to a display label and emoji icon. */
export const NOTIFICATION_META = {
  new_match:               { label: "New Match",              icon: "💞" },
  new_message:             { label: "New Message",            icon: "💬" },
  new_like:                { label: "Someone Liked You",      icon: "❤️" },
  super_like:              { label: "Super Like!",            icon: "⭐" },
  event_invite:            { label: "Event Invite",           icon: "🎉" },
  event_reminder:          { label: "Event Reminder",         icon: "📅" },
  premium_expiry:          { label: "Premium Expiring Soon",  icon: "💎" },
  verification_approved:   { label: "Identity Verified",      icon: "✅" },
  verification_rejected:   { label: "Verification Rejected",  icon: "❌" },
  referral_joined:         { label: "Referral Joined",        icon: "🔗" },
  system:                  { label: "Bondies",                icon: "🔔" },
};

const NotificationService = {
  /**
   * Fetch the current user's notifications, newest first.
   * @param {{ page?: number, limit?: number }} params
   * @returns {{ data: Notification[], unreadCount: number, pagination }}
   */
  getNotifications: async (params = {}) => {
    const response = await apiClient.get("/api/notifications", { params });
    return response.data;
  },

  /**
   * Lightweight call — returns only the unread count (useful for tab badges).
   * @returns {number}
   */
  getUnreadCount: async () => {
    const response = await apiClient.get("/api/notifications", {
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
      `/api/notifications/${notificationId}/read`
    );
    return response.data;
  },

  /**
   * Mark every unread notification as read in one call.
   * Call this when the user opens the notifications screen.
   */
  markAllAsRead: async () => {
    const response = await apiClient.patch("/api/notifications/read-all");
    return response.data;
  },

  /**
   * Delete a notification.
   * @param {string} notificationId
   */
  deleteNotification: async (notificationId) => {
    const response = await apiClient.delete(
      `/api/notifications/${notificationId}`
    );
    return response.data;
  },
};

export default NotificationService;
