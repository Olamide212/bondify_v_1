const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const { getRedisClient, isRedisEnabled } = require('../config/redis');

/**
 * Build a rate-limit store option.
 * Uses Redis when available (distributed, multi-server safe),
 * falls back to in-memory for single-server / local development.
 */
const buildStore = (prefix) => {
  if (isRedisEnabled()) {
    return new RedisStore({
      sendCommand: (...args) => getRedisClient().sendCommand(args),
      prefix,
    });
  }
  return undefined; // express-rate-limit defaults to in-memory
};

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  store: buildStore('rl:auth:'),
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: 'Too many requests from this IP, please try again later.',
  store: buildStore('rl:api:'),
});

const messageSendLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'You are sending messages too quickly. Please slow down.',
  store: buildStore('rl:msg:'),
});

module.exports = {
  authLimiter,
  apiLimiter,
  messageSendLimiter,
};
