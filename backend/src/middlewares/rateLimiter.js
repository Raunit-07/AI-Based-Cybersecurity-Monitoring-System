const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis').default;
const { getRedisClient } = require('../config/redis');

const createRateLimiter = (options) => {
  const client = getRedisClient();
  const store = client ? new RedisStore({
    sendCommand: (...args) => client.sendCommand(args),
  }) : undefined; // falls back to memory store if undefined

  return rateLimit({
    store,
    ...options
  });
};

const globalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per `window`
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 50, // Limit each IP to 50 login requests per `window`
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many auth attempts from this IP, please try again after 15 minutes'
});

module.exports = {
  globalLimiter,
  authLimiter
};
