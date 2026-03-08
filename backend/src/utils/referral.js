const crypto = require('crypto');

/**
 * Generate a unique referral code
 * @param {string} userId - User's MongoDB ObjectId string
 * @returns {string} - 8-char uppercase alphanumeric referral code
 */
const generateReferralCode = (userId) => {
  const hash = crypto
    .createHash('sha256')
    .update(userId + Date.now().toString())
    .digest('hex');
  return hash.substring(0, 8).toUpperCase();
};

module.exports = { generateReferralCode };
