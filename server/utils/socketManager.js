const { Server } = require('socket.io');

let io = null;

const initSocket = (httpServer, allowedOrigins = []) => {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (
          !origin ||
          allowedOrigins.includes(origin) ||
          /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)
        ) {
          return callback(null, true);
        }
        return callback(new Error(`Socket CORS blocked for origin: ${origin}`));
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Live client connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`🔌 Live client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const emitLiveUpdate = (eventType, payload = {}) => {
  if (!io) return;
  io.emit('slotsync:liveUpdate', {
    eventType,
    timestamp: new Date().toISOString(),
    ...payload,
  });
};

module.exports = { initSocket, emitLiveUpdate };