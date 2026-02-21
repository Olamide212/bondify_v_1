const jwt = require('jsonwebtoken');

const generateToken = (userId, expiresIn) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: expiresIn || process.env.JWT_EXPIRES_IN,
  });
};

const generateOnboardingToken = (userId) => {
  return jwt.sign(
    { userId, type: 'onboarding' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.ONBOARDING_TOKEN_EXPIRES_IN }
  );
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateToken,
  generateOnboardingToken,
  verifyToken,
};
