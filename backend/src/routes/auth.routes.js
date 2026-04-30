import express from "express";
import authController from "../controllers/auth.controller.js";
import { registerValidator, loginValidator } from "../validators/auth.validator.js";
import validate from "../middlewares/validate.middleware.js";
import { authLimiter } from "../middlewares/rateLimiter.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post('/register', authLimiter, registerValidator, validate, authController.register);
router.post('/login', authLimiter, loginValidator, validate, authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authMiddleware, authController.logout);
router.get('/me', authMiddleware, authController.getMe);

export default router;