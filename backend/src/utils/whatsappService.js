/**
 * whatsappService.js
 *
 * Sends WhatsApp notifications via Twilio when users are offline.
 *
 * Required .env vars:
 *   TWILIO_ACCOUNT_SID         — from Twilio console
 *   TWILIO_AUTH_TOKEN          — from Twilio console
 *   TWILIO_WHATSAPP_FROM       — e.g. whatsapp:+14155238886 (sandbox)
 *                                or whatsapp:+1XXXXXXXXXX  (production number)
 *   APP_DEEP_LINK_BASE         — e.g. https://bondies.app  (for notification CTAs)
 *
 * Twilio WhatsApp sandbox (for dev/testing):
 *   1. Go to Twilio Console → Messaging → Try it out → Send a WhatsApp message
 *   2. Have your test users send "join <sandbox-keyword>" to +14155238886
 *   3. They can then receive sandbox messages
 *
 * For production:
 *   Apply for a WhatsApp Business number in Twilio Console.
 *   Meta approval takes 2-7 business days.
 *   You must use pre-approved Message Templates for notifications
 *   (free-form messages only work within 24h of user-initiated conversation).
 */

const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const FROM     = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';
const APP_BASE = process.env.APP_DEEP_LINK_BASE   || 'https://bondies.app';

// ─── Internal send ────────────────────────────────────────────────────────────
/**
 * @param {string} toPhone  — E.164 format e.g. +2348012345678
 * @param {string} body     — message text
 */
const sendWhatsApp = async (toPhone, body) => {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    console.warn('[whatsapp] Twilio credentials not configured — skipping.');
    return null;
  }

  if (!toPhone) {
    console.warn('[whatsapp] No phone number provided — skipping.');
    return null;
  }

  // Normalise to E.164 whatsapp: prefix
  const to = toPhone.startsWith('whatsapp:')
    ? toPhone
    : `whatsapp:${toPhone.startsWith('+') ? toPhone : `+${toPhone}`}`;

  const message = await client.messages.create({ from: FROM, to, body });
  return message;
};

// ─── Match notification ───────────────────────────────────────────────────────
/**
 * Notify a user they got a new match.
 *
 * @param {{ toPhone: string, recipientName: string, matchedName: string, matchId: string }} opts
 */
const sendMatchNotification = async ({ toPhone, recipientName, matchedName, matchId }) => {
  try {
    const body = [
      `🧡 *Bondies* — New Match!`,
      ``,
      `Hey ${recipientName}! You and *${matchedName}* just matched 🎉`,
      ``,
      `Say hello before someone else does 👇`,
      `${APP_BASE}/matches/${matchId}`,
      ``,
      `_Reply STOP to unsubscribe from Bondies notifications._`,
    ].join('\n');

    await sendWhatsApp(toPhone, body);
    console.log(`[whatsapp] Match notification sent → ${toPhone}`);
  } catch (err) {
    // Never crash the match flow over a WhatsApp failure
    console.error(`[whatsapp] Failed to send match notification to ${toPhone}:`, err.message);
  }
};

// ─── Message notification ─────────────────────────────────────────────────────
/**
 * Notify a user they received a new message.
 *
 * @param {{ toPhone: string, recipientName: string, senderName: string, matchId: string, messagePreview: string, messageType: string }} opts
 */
const sendMessageNotification = async ({
  toPhone,
  recipientName,
  senderName,
  matchId,
  messagePreview = '',
  messageType    = 'text',
}) => {
  try {
    const preview =
      messageType === 'image' ? '📷 Sent you a photo'
      : messageType === 'voice' ? '🎙️ Sent you a voice note'
      : messagePreview.length > 80
        ? `${messagePreview.slice(0, 80)}…`
        : messagePreview;

    const body = [
      `💬 *Bondies* — New Message`,
      ``,
      `Hey ${recipientName}! *${senderName}* sent you a message:`,
      ``,
      `_"${preview}"_`,
      ``,
      `Reply now 👇`,
      `${APP_BASE}/chat/${matchId}`,
      ``,
      `_Reply STOP to unsubscribe from Bondies notifications._`,
    ].join('\n');

    await sendWhatsApp(toPhone, body);
    console.log(`[whatsapp] Message notification sent → ${toPhone}`);
  } catch (err) {
    console.error(`[whatsapp] Failed to send message notification to ${toPhone}:`, err.message);
  }
};

// ─── Opt-out handler (called from webhook) ───────────────────────────────────
/**
 * Handle STOP replies from users — marks them as opted out.
 * Call this from your Twilio webhook route.
 *
 * @param {string} fromPhone — phone number that sent STOP
 */
const handleOptOut = async (fromPhone) => {
  try {
    const User = require('../models/User');
    const phone = fromPhone.replace('whatsapp:', '').replace('+', '');

    await User.findOneAndUpdate(
      { phoneNumber: { $in: [phone, `+${phone}`] } },
      { whatsappOptIn: false }
    );
    console.log(`[whatsapp] Opt-out recorded for ${fromPhone}`);
  } catch (err) {
    console.error(`[whatsapp] Failed to process opt-out for ${fromPhone}:`, err.message);
  }
};

module.exports = {
  sendMatchNotification,
  sendMessageNotification,
  handleOptOut,
};