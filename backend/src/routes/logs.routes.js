import express from "express";
import { createLog, getLogs } from "../controllers/logs.controller.js";
import { apiKeyAuth } from "../middlewares/apiKeyAuth.js";
import { logValidator } from "../validators/log.validator.js";
import validate from "../middlewares/validate.middleware.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// ================= LOG INGESTION =================
// Only trusted sources (simulation) can send logs
router.post("/", apiKeyAuth, logValidator, validate, createLog);

// ================= GET LOGS =================
// Protected route
router.get("/", authMiddleware, getLogs);

export default router;