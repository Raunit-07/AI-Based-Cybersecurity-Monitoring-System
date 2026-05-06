import rateLimit from "express-rate-limit";

/**
 * ===============================
 * RATE LIMIT RESPONSE HANDLER
 * ===============================
 */
const rateLimitHandler = (req, res) => {
  return res.status(429).json({
    success: false,
    data: null,
    message: "Too many requests, please try again later",
  });
};

/**
 * ===============================
 * GLOBAL LIMITER
 * ===============================
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

/**
 * ===============================
 * AUTH LIMITER
 * ===============================
 *
 * Used on:
 * POST /api/auth/register
 * POST /api/auth/login
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: rateLimitHandler,
});