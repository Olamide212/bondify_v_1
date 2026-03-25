const { createClient } = require('redis');

let redisClient = null;
let redisEnabled = false;

const connectRedis = async () => {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    console.log('Redis: REDIS_URL not set – running without Redis (single-server mode)');
    return null;
  }

  try {
    const client = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 5000,
        reconnectStrategy: (retries) => {
          if (retries > 5) {
            console.error('Redis: max reconnect attempts reached, giving up');
            return new Error('Redis max retries exceeded');
          }
          return Math.min(retries * 500, 3000);
        },
      },
    });

    client.on('error', (err) => {
      console.error('Redis client error:', err.message);
    });

    client.on('connect', () => {
      console.log('Redis: connected');
    });

    client.on('reconnecting', () => {
      console.log('Redis: reconnecting…');
    });

    await client.connect();
    redisClient = client;
    redisEnabled = true;
    return client;
  } catch (err) {
    console.error('Redis: failed to connect –', err.message);
    console.log('Redis: continuing without Redis (single-server mode)');
    return null;
  }
};

const getRedisClient = () => redisClient;

const isRedisEnabled = () => redisEnabled;

module.exports = { connectRedis, getRedisClient, isRedisEnabled };
