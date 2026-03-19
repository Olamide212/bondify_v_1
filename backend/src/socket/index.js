const { Server } = require('socket.io');
const { verifyToken } = require('../config/jwt');

let io;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
    },
  });

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
