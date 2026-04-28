const { createClient } = require('redis');
const logger = require('../utils/logger');

let redisClient;

const connectRedis = async () => {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
      socket: {
        reconnectStrategy: false
      }
    });

    redisClient.on('error', (err) => logger.warn(`Redis Client Error: ${err.message}`));
    redisClient.on('connect', () => logger.info('Redis Client connected'));

    await redisClient.connect();
  } catch (error) {
    logger.warn(`Could not connect to Redis: ${error.message}. Running without Redis.`);
    redisClient = null; // graceful fallback
  }
};

const getRedisClient = () => redisClient;

module.exports = { connectRedis, getRedisClient };
