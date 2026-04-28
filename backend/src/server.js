require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const { connectRedis } = require('./config/redis');
const { initSockets } = require('./sockets');
const logger = require('./utils/logger');

const server = http.createServer(app);

// Initialize Socket.IO
initSockets(server);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to external services
    await connectDB();
    await connectRedis();

    server.listen(PORT, () => {
      logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });

  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});
