import express from "express";

import authController from "../controllers/auth.controller.js";

import {
  registerValidator,
  loginValidator,
} from "../validators/auth.validator.js";

import validate from "../middlewares/validate.middleware.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";

import { authLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

/**
 * =====================================
 * PUBLIC AUTH ROUTES
 * =====================================
 */

/**
 * ================= REGISTER =================
 * Protected with:
 * - rate limiter
 * - validators
 * - validation middleware
 */
router.post(
  "/register",

  authLimiter,

  registerValidator,

  validate,

  authController.register
);

/**
 * ================= LOGIN =================
 * Protected against:
 * - brute-force attacks
 * - auth spam
 */
router.post(
  "/login",

  authLimiter,

  loginValidator,

  validate,

  authController.login
);

/**
 * ================= REFRESH TOKEN =================
 * Uses secure httpOnly refresh cookie
 *
 * IMPORTANT:
 * Required for automatic session persistence
 * in frontend axios interceptor.
 */
router.post(
  "/refresh-token",

  authLimiter,

  authController.refreshToken
);

/**
 * =====================================
 * PROTECTED AUTH ROUTES
 * =====================================
 */

/**
 * ================= CURRENT USER =================
 */
router.get(
  "/me",

  authMiddleware,

  authController.getMe
);

/**
 * ================= LOGOUT =================
 * Clears refresh token
 * Invalidates session
 */
router.post(
  "/logout",

  authMiddleware,

  authController.logout
);

export default router;