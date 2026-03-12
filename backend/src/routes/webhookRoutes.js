const express = require('express');
const { handleOptOut } = require('../utils/whatsappService');
const router  = express.Router();

// Twilio sends form-encoded POST, not JSON
router.post('/webhooks/whatsapp', express.urlencoded({ extended: false }), async (req, res) => {
  const body = (req.body.Body || '').trim().toUpperCase();
  const from = req.body.From || '';
  if (body === 'STOP') await handleOptOut(from);
  res.status(200).send('<Response></Response>');
});

module.exports = router;