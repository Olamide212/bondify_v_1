/**
 * services/index.js
 * ─────────────────────────────────────────────────────────────
 * Single import point for every Bondies service.
 *
 * Usage:
 *   import { AuthService, EventService, AIService } from '@/services';
 *
 *   // Or import one service directly:
 *   import SettingsService from '@/services/settingsService';
 * ─────────────────────────────────────────────────────────────
 */

export { default as AIService } from "./aiService";
export { default as AuthService } from "./authService";
export { default as EventService } from "./eventService";
export { default as NotificationService } from "./notificationService";
export { default as PremiumService } from "./premiumService";
export { default as PushNotificationService } from "./pushNotificationService";
export { default as SettingsService } from "./settingsService";
export { default as VerificationService } from "./verificationService";

// Enums / constants (so screens never need to import from individual files)
export { BIO_TONES } from "./aiService";
export { EVENT_CATEGORIES, RSVP_STATUS } from "./eventService";
export { NOTIFICATION_META } from "./notificationService";
export { PLAN_DETAILS } from "./premiumService";
export { ID_TYPES, VERIFICATION_STATUS } from "./verificationService";

// ─────────────────────────────────────────────────────────────
// Error helper
// ─────────────────────────────────────────────────────────────
/**
 * Extract a human-readable message from an axios error thrown
 * by any of the service calls above.
 *
 * @param {unknown} error
 * @returns {string}
 *
 * @example
 *   try {
 *     await AuthService.login({ email, password });
 *   } catch (err) {
 *     Alert.alert('Login failed', getErrorMessage(err));
 *   }
 */
export const getErrorMessage = (error) => {
  // Server responded with a { message: '...' } body
  if (error?.response?.data?.message) return error.response.data.message;
  // Axios network / timeout error
  if (error?.message) return error.message;
  return "Something went wrong. Please try again.";
};
