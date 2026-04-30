import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { getRedisClient } from "../config/redis.js";

// ================= HELPER =================
const createRateLimiter = (options) => {
  const client = getRedisClient();

  const store = client
    ? new RedisStore({
        sendCommand: (...args) => client.sendCommand(args),
      })
    : undefined; // fallback to memory store

  return rateLimit({
    store,
    standardHeaders: true,
    legacyHeaders: false,
    ...options,
  });
};

// ================= GLOBAL LIMITER =================
export const globalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: "Too many requests, try again later",
});

// ================= AUTH LIMITER =================
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: "Too many login attempts, try again later",
});