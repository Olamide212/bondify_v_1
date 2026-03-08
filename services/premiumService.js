/**
 * premiumService.js
 * Handles all /api/premium endpoints.
 *
 * Payment flow:
 *  1. Call getPlans() → show plan cards
 *  2. User picks a plan → open Stripe / PayStack payment sheet
 *  3. On payment confirmed → call activatePremium() with the transactionId
 */

import apiClient from "../utils/axiosInstance";

/** Local plan metadata for UI rendering (price, colour, feature list). */
export const PLAN_DETAILS = {
  basic: {
    key: "basic",
    label: "Basic",
    price: 9.99,
    color: "#A78BFA",
    features: [
      "5 Super Likes / month",
      "1 Boost / month",
      "Rewind last swipe",
    ],
  },
  gold: {
    key: "gold",
    label: "Gold",
    price: 19.99,
    color: "#F59E0B",
    features: [
      "Unlimited Likes",
      "See Who Liked You",
      "10 Super Likes / month",
      "3 Boosts / month",
      "Rewind last swipe",
      "Priority Matching",
    ],
  },
  platinum: {
    key: "platinum",
    label: "Platinum",
    price: 29.99,
    color: "#6366F1",
    features: [
      "Everything in Gold",
      "Unlimited Super Likes",
      "10 Boosts / month",
      "Incognito Mode",
      "Priority Matching",
    ],
  },
};

const PremiumService = {
  /**
   * Fetch available subscription plans from the server.
   * @returns {{ basic, gold, platinum }}
   */
  getPlans: async () => {
    const response = await apiClient.get("/api/premium/plans");
    return response.data;
  },

  /**
   * Check the current user's premium subscription status.
   * Also auto-downgrades expired subscriptions on the backend.
   * @returns {{
   *   isPremium: boolean,
   *   plan: 'basic'|'gold'|'platinum'|null,
   *   expiresAt: string|null,
   *   daysRemaining: number,
   *   features: object|null
   * }}
   */
  getSubscriptionStatus: async () => {
    const response = await apiClient.get("/api/premium/status");
    return response.data;
  },

  /**
   * Activate a premium plan after a confirmed payment.
   *
   * ⚠️  Never call this before the payment provider confirms success.
   *     In production prefer a server-side webhook to call this endpoint.
   *
   * @param {{
   *   plan: 'basic'|'gold'|'platinum',
   *   transactionId: string,
   *   paymentProvider?: 'stripe'|'paystack'|'revenuecat'
   * }} data
   */
  activatePremium: async (data) => {
    const response = await apiClient.post("/api/premium/activate", data);
    return response.data;
  },

  /**
   * Cancel the active subscription.
   * Access continues until the current billing period ends.
   * @returns {{ expiresAt: string }}
   */
  cancelPremium: async () => {
    const response = await apiClient.post("/api/premium/cancel");
    return response.data;
  },
};

export default PremiumService;
