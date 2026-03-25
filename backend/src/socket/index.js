const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { verifyToken } = require('../config/jwt');
const { getRedisClient, isRedisEnabled } = require('../config/redis');

let io;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
    },
  });

  // Use Redis adapter when Redis is available (enables multi-server support)
  if (isRedisEnabled()) {
    const setupRedisAdapter = async () => {
      try {
        const pubClient = getRedisClient();
        const subClient = pubClient.duplicate();
        await subClient.connect();
        io.adapter(createAdapter(pubClient, subClient));
        console.log('Socket.io: Redis adapter enabled (multi-server mode)');
      } catch (err) {
        console.error('Socket.io: Redis adapter error –', err.message);
        console.log('Socket.io: falling back to in-memory adapter');
      }
    };
    setupRedisAdapter();
  }

  io.use((socket, next) => {
    const rawToken =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '') ||
      socket.handshake.query?.token;

    if (!rawToken) {
      return next(new Error('Unauthorized: missing token'));
    }

    const decoded = verifyToken(rawToken);
    if (!decoded?.userId) {
      return next(new Error('Unauthorized: invalid token'));
    }

    socket.userId = String(decoded.userId);
    return next();
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.userId}`);

    // ── Dating chat rooms ─────────────────────────────────────────────────
    socket.on('chat:join', ({ matchId }) => {
      if (!matchId) return;
      socket.join(`match:${matchId}`);
    });

    socket.on('chat:leave', ({ matchId }) => {
      if (!matchId) return;
      socket.leave(`match:${matchId}`);
    });

    // ── Bondup chat rooms ─────────────────────────────────────────────────
    socket.on('bondupChat:join', ({ chatId }) => {
      if (!chatId) return;
      socket.join(`bondupChat:${chatId}`);
    });

    socket.on('bondupChat:leave', ({ chatId }) => {
      if (!chatId) return;
      socket.leave(`bondupChat:${chatId}`);
    });

    socket.on('disconnect', () => {
      // no-op
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

module.exports = {
  initSocket,
  getIO,
};
