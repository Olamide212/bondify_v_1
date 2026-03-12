// /**
//  * termiiService.js
//  *
//  * Thin wrapper around the Termii Templates email API.
//  *
//  * Required env vars:
//  *   TERMII_API_KEY                – your Termii API key
//  *   TERMII_BASE_URL               – e.g. https://v3.api.termii.com
//  *   TERMII_EMAIL_CONFIG_ID        – email_configuration_id from Termii dashboard
//  *   TERMII_OTP_TEMPLATE_ID        – template_id for the OTP email template
//  *   TERMII_WELCOME_TEMPLATE_ID    – (optional) template_id for the welcome email
//  *
//  * Termii template variables expected by each template:
//  *   OTP template      → { name, otp, expiry_minutes }
//  *   Welcome template  → { name }
//  */

// const axios = require('axios');

// const BASE_URL        = process.env.TERMII_BASE_URL        || 'https://v3.api.termii.com';
// const API_KEY         = process.env.TERMII_API_KEY;
// const EMAIL_CONFIG_ID = process.env.TERMII_EMAIL_CONFIG_ID;
// const OTP_TEMPLATE_ID = process.env.TERMII_OTP_TEMPLATE_ID;
// const WELCOME_TEMPLATE_ID = process.env.TERMII_WELCOME_TEMPLATE_ID;

// // ─── Core sender ──────────────────────────────────────────────────────────────

// const sendTemplateEmail = async ({ email, subject, templateId, variables }) => {
//   if (!API_KEY || !EMAIL_CONFIG_ID || !templateId) {
//     // Fail loudly in production; silently log in dev so missing config doesn't
//     // crash the server before env vars are set.
//     const msg = `[termiiService] Missing config — API_KEY:${!!API_KEY} EMAIL_CONFIG_ID:${!!EMAIL_CONFIG_ID} TEMPLATE_ID:${!!templateId}`;
//     if (process.env.NODE_ENV === 'production') throw new Error(msg);
//     console.warn(msg);
//     return null;
//   }

//   const payload = {
//     api_key:                API_KEY,
//     email_configuration_id: EMAIL_CONFIG_ID,
//     template_id:            templateId,
//     email,
//     subject,
//     variables,
//   };

//   const response = await axios.post(
//     `${BASE_URL}/api/templates/send-email`,
//     payload,
//     { headers: { 'Content-Type': 'application/json' } }
//   );

//   return response.data;
// };

// // ─── Named senders ────────────────────────────────────────────────────────────

// /**
//  * Send a one-time OTP to a user's email address.
//  *
//  * @param {{ email: string, firstName: string, otp: string, expiryMinutes?: number }} opts
//  */
// const sendOtpEmail = async ({ email, firstName, otp, expiryMinutes = 10 }) => {
//   if (!OTP_TEMPLATE_ID) {
//     // Fallback: log to console so dev flow still works without a template set up
//     console.log(`[termiiService] OTP email for ${email}: ${otp} (template not configured)`);
//     return null;
//   }

//   try {
//     const result = await sendTemplateEmail({
//       email,
//       subject: 'Your Bondies verification code',
//       templateId: OTP_TEMPLATE_ID,
//       variables: {
//         name:            firstName || 'there',
//         otp:             String(otp),
//         expiry_minutes:  String(expiryMinutes),
//       },
//     });
//     console.log(`[termiiService] OTP email sent to ${email}`);
//     return result;
//   } catch (err) {
//     // Never let email failure crash the auth flow — log and continue
//     console.error(`[termiiService] Failed to send OTP email to ${email}:`, err?.response?.data || err.message);
//     return null;
//   }
// };

// /**
//  * Send a welcome email after a user completes verification.
//  *
//  * @param {{ email: string, firstName: string }} opts
//  */
// const sendWelcomeEmail = async ({ email, firstName }) => {
//   if (!WELCOME_TEMPLATE_ID) {
//     console.log(`[termiiService] Welcome email for ${email} (template not configured)`);
//     return null;
//   }

//   try {
//     const result = await sendTemplateEmail({
//       email,
//       subject: 'Welcome to Bondies 💛',
//       templateId: WELCOME_TEMPLATE_ID,
//       variables: { name: firstName || 'there' },
//     });
//     console.log(`[termiiService] Welcome email sent to ${email}`);
//     return result;
//   } catch (err) {
//     console.error(`[termiiService] Failed to send welcome email to ${email}:`, err?.response?.data || err.message);
//     return null;
//   }
// };

// module.exports = { sendOtpEmail, sendWelcomeEmail };



/**
 * termiiService.js
 *
 * Drop-in replacement using Resend (https://resend.com).
 * Keeps the same exported function signatures so nothing else needs to change.
 *
 * Required .env vars:
 *   RESEND_API_KEY   — from your Resend dashboard (starts with re_)
 *   RESEND_FROM      — verified sender e.g. "Bondies <noreply@yourdomain.com>"
 *   OTP_EXPIRES_IN   — expiry in minutes (default 10)
 */

const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = process.env.RESEND_FROM || 'Bondies <noreply@yourdomain.com>';
const EXPIRY = process.env.OTP_EXPIRES_IN || '10';

// ── Internal send helper ──────────────────────────────────────────────────────
const send = async ({ to, subject, html }) => {
  const { error } = await resend.emails.send({ from: FROM, to, subject, html });
  if (error) throw new Error(error.message);
};

// ── OTP Email ─────────────────────────────────────────────────────────────────
const sendOtpEmail = async ({ email, firstName, otp }) => {
  try {
    await send({
      to:      email,
      subject: `${otp} is your Bondies verification code`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px 24px;background:#ffffff;border-radius:16px;border:1px solid #F3F4F6">
          <h2 style="color:#E8651A;margin-top:0;font-size:22px">Hey ${firstName || 'there'} 👋</h2>
          <p style="color:#374151;font-size:15px;line-height:1.7;margin-bottom:24px">
            Use the code below to verify your Bondies account.
            It expires in <strong>${EXPIRY} minutes</strong>.
          </p>
          <div style="background:#FEF3EC;border-radius:12px;padding:28px;text-align:center;margin-bottom:24px">
            <span style="font-size:40px;font-weight:700;letter-spacing:12px;color:#E8651A;font-family:monospace">
              ${otp}
            </span>
          </div>
          <p style="color:#9CA3AF;font-size:13px;line-height:1.6">
            If you didn't request this, you can safely ignore this email.
            Never share this code with anyone — Bondies will never ask for it.
          </p>
          <hr style="border:none;border-top:1px solid #F3F4F6;margin:24px 0"/>
          <p style="color:#D1D5DB;font-size:12px;text-align:center;margin:0">
            © ${new Date().getFullYear()} Bondies · All rights reserved
          </p>
        </div>
      `,
    });
    console.log(`[resend] OTP email sent → ${email}`);
  } catch (err) {
    console.error(`[resend] Failed to send OTP email to ${email}:`, err.message);
  }
};

// ── Welcome Email ─────────────────────────────────────────────────────────────
const sendWelcomeEmail = async ({ email, firstName }) => {
  try {
    await send({
      to:      email,
      subject: `Welcome to Bondies 🧡`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px 24px;background:#ffffff;border-radius:16px;border:1px solid #F3F4F6">
          <h2 style="color:#E8651A;margin-top:0;font-size:22px">Welcome, ${firstName || 'there'}! 🎉</h2>
          <p style="color:#374151;font-size:15px;line-height:1.7">
            You've just joined a community of people who are done with the noise and ready for something real.
            Whether you're looking for your forever person or just want to meet someone who truly gets you —
            you're in the right place.
          </p>
          <p style="color:#374151;font-size:15px;font-weight:600;margin-bottom:8px">Here's how to get started:</p>
          <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
            <tr>
              <td style="width:36px;padding:8px 8px 8px 0;vertical-align:top;font-size:20px">👤</td>
              <td style="padding:8px 0">
                <span style="color:#111;font-size:14px;font-weight:600">Complete your profile</span><br/>
                <span style="color:#9CA3AF;font-size:13px">The more you share, the better your matches</span>
              </td>
            </tr>
            <tr>
              <td style="width:36px;padding:8px 8px 8px 0;vertical-align:top;font-size:20px">💬</td>
              <td style="padding:8px 0">
                <span style="color:#111;font-size:14px;font-weight:600">Add your prompts</span><br/>
                <span style="color:#9CA3AF;font-size:13px">Let your personality do the talking</span>
              </td>
            </tr>
            <tr>
              <td style="width:36px;padding:8px 8px 8px 0;vertical-align:top;font-size:20px">🎙️</td>
              <td style="padding:8px 0">
                <span style="color:#111;font-size:14px;font-weight:600">Record a voice prompt</span><br/>
                <span style="color:#9CA3AF;font-size:13px">Your voice is your vibe</span>
              </td>
            </tr>
          </table>
          <p style="color:#374151;font-size:14px;line-height:1.7">
            The best connections start with honesty. So be yourself — that's exactly who someone out there is looking for. 🧡
          </p>
          <hr style="border:none;border-top:1px solid #F3F4F6;margin:24px 0"/>
          <p style="color:#D1D5DB;font-size:12px;text-align:center;margin:0">
            © ${new Date().getFullYear()} Bondies · All rights reserved
          </p>
        </div>
      `,
    });
    console.log(`[resend] Welcome email sent → ${email}`);
  } catch (err) {
    console.error(`[resend] Failed to send welcome email to ${email}:`, err.message);
  }
};

module.exports = { sendOtpEmail, sendWelcomeEmail };