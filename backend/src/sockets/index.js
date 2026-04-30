const { Server } = require('socket.io');
const logger = require('../utils/logger');

let io;

const initSockets = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL
        ? [process.env.FRONTEND_URL]
        : ['http://localhost:5173', 'http://127.0.0.1:5173'],
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    logger.info(`⚡ Client connected: ${socket.id}`);

    const trafficInterval = setInterval(() => {
      socket.emit('traffic_update', {
        time: new Date().toLocaleTimeString(),
        requests: Math.floor(Math.random() * 500) + 100,
        blocked: Math.floor(Math.random() * 50),
      });
    }, 2000);

    socket.on('disconnect', () => {
      logger.info(`❌ Client disconnected: ${socket.id}`);
      clearInterval(trafficInterval);
    });
  });

  return io;
};

// ✅ FIXED emitAlert
const emitAlert = (alert) => {
  if (!io) {
    logger.error('❌ Socket.IO not initialized');
    return;
  }

  const formattedAlert = {
    id: alert._id,
    type: alert.type,
    severity: alert.severity,
    source: alert.source || 'system',
    time: alert.createdAt ? alert.createdAt.toISOString() : new Date().toISOString(),
    status: alert.status || 'active'
  };

  io.emit('new-alert', formattedAlert);
};

module.exports = { initSockets, emitAlert };