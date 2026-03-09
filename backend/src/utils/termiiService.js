/**
 * termiiService.js
 *
 * Thin wrapper around the Termii Templates email API.
 *
 * Required env vars:
 *   TERMII_API_KEY                – your Termii API key
 *   TERMII_BASE_URL               – e.g. https://v3.api.termii.com
 *   TERMII_EMAIL_CONFIG_ID        – email_configuration_id from Termii dashboard
 *   TERMII_OTP_TEMPLATE_ID        – template_id for the OTP email template
 *   TERMII_WELCOME_TEMPLATE_ID    – (optional) template_id for the welcome email
 *
 * Termii template variables expected by each template:
 *   OTP template      → { name, otp, expiry_minutes }
 *   Welcome template  → { name }
 */

const axios = require('axios');

const BASE_URL        = process.env.TERMII_BASE_URL        || 'https://v3.api.termii.com';
const API_KEY         = process.env.TERMII_API_KEY;
const EMAIL_CONFIG_ID = process.env.TERMII_EMAIL_CONFIG_ID;
const OTP_TEMPLATE_ID = process.env.TERMII_OTP_TEMPLATE_ID;
const WELCOME_TEMPLATE_ID = process.env.TERMII_WELCOME_TEMPLATE_ID;

// ─── Core sender ──────────────────────────────────────────────────────────────

const sendTemplateEmail = async ({ email, subject, templateId, variables }) => {
  if (!API_KEY || !EMAIL_CONFIG_ID || !templateId) {
    // Fail loudly in production; silently log in dev so missing config doesn't
    // crash the server before env vars are set.
    const msg = `[termiiService] Missing config — API_KEY:${!!API_KEY} EMAIL_CONFIG_ID:${!!EMAIL_CONFIG_ID} TEMPLATE_ID:${!!templateId}`;
    if (process.env.NODE_ENV === 'production') throw new Error(msg);
    console.warn(msg);
    return null;
  }

  const payload = {
    api_key:                API_KEY,
    email_configuration_id: EMAIL_CONFIG_ID,
    template_id:            templateId,
    email,
    subject,
    variables,
  };

  const response = await axios.post(
    `${BASE_URL}/api/templates/send-email`,
    payload,
    { headers: { 'Content-Type': 'application/json' } }
  );

  return response.data;
};

// ─── Named senders ────────────────────────────────────────────────────────────

/**
 * Send a one-time OTP to a user's email address.
 *
 * @param {{ email: string, firstName: string, otp: string, expiryMinutes?: number }} opts
 */
const sendOtpEmail = async ({ email, firstName, otp, expiryMinutes = 10 }) => {
  if (!OTP_TEMPLATE_ID) {
    // Fallback: log to console so dev flow still works without a template set up
    console.log(`[termiiService] OTP email for ${email}: ${otp} (template not configured)`);
    return null;
  }

  try {
    const result = await sendTemplateEmail({
      email,
      subject: 'Your Bondies verification code',
      templateId: OTP_TEMPLATE_ID,
      variables: {
        name:            firstName || 'there',
        otp:             String(otp),
        expiry_minutes:  String(expiryMinutes),
      },
    });
    console.log(`[termiiService] OTP email sent to ${email}`);
    return result;
  } catch (err) {
    // Never let email failure crash the auth flow — log and continue
    console.error(`[termiiService] Failed to send OTP email to ${email}:`, err?.response?.data || err.message);
    return null;
  }
};

/**
 * Send a welcome email after a user completes verification.
 *
 * @param {{ email: string, firstName: string }} opts
 */
const sendWelcomeEmail = async ({ email, firstName }) => {
  if (!WELCOME_TEMPLATE_ID) {
    console.log(`[termiiService] Welcome email for ${email} (template not configured)`);
    return null;
  }

  try {
    const result = await sendTemplateEmail({
      email,
      subject: 'Welcome to Bondies 💛',
      templateId: WELCOME_TEMPLATE_ID,
      variables: { name: firstName || 'there' },
    });
    console.log(`[termiiService] Welcome email sent to ${email}`);
    return result;
  } catch (err) {
    console.error(`[termiiService] Failed to send welcome email to ${email}:`, err?.response?.data || err.message);
    return null;
  }
};

module.exports = { sendOtpEmail, sendWelcomeEmail };