import express from "express";
import authController from "../controllers/auth.controller.js";

import {
  registerValidator,
  loginValidator,
} from "../validators/auth.validator.js";

import validate from "../middlewares/validate.middleware.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * ================= PUBLIC ROUTES =================
 */

// Register
// TEMP FIX: authLimiter removed because it is causing "next is not a function"
router.post(
  "/register",
  registerValidator,
  validate,
  authController.register
);

// Login
router.post(
  "/login",
  loginValidator,
  validate,
  authController.login
);

// Refresh Token
router.post("/refresh-token", authController.refreshToken);

/**
 * ================= PROTECTED ROUTES =================
 */

router.post("/logout", authMiddleware, authController.logout);

router.get("/me", authMiddleware, authController.getMe);

export default router;