import express from "express";
import { ingestTelemetry, getLive, getStats } from "../controllers/telemetry.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { deviceAuthMiddleware } from "../middlewares/deviceAuth.middleware.js";

const router = express.Router();

/**
 * Ingest agent telemetry (device key authenticated)
 */
router.post("/ingest", deviceAuthMiddleware, ingestTelemetry);

/**
 * Get live telemetry (JWT user authenticated)
 */
router.get("/live", authMiddleware, getLive);

/**
 * Get telemetry stats (JWT user authenticated)
 */
router.get("/stats", authMiddleware, getStats);

export default router;
