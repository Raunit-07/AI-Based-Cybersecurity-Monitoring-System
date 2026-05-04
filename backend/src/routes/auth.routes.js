import express from "express";
import authController from "../controllers/auth.controller.js";

import {
    registerValidator,
    loginValidator,
} from "../validators/auth.validator.js";

import validate from "../middlewares/validate.middleware.js";
import { authLimiter } from "../middlewares/rateLimiter.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * ================= PUBLIC ROUTES =================
 */

// Register
router.post(
    "/register",
    authLimiter,
    registerValidator,
    validate,
    authController.register
);

// Login
router.post(
    "/login",
    authLimiter,
    loginValidator,
    validate,
    authController.login
);

// Refresh Token (Important: no authMiddleware here)
router.post("/refresh-token", authController.refreshToken);

/**
 * ================= PROTECTED ROUTES =================
 */

// Logout (requires valid user)
router.post("/logout", authMiddleware, authController.logout);

// Get current logged-in user
router.get("/me", authMiddleware, authController.getMe);

export default router;
