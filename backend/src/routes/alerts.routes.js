import express from "express";

import alertsController from "../controllers/alerts.controller.js";

import {
    authMiddleware,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * =====================================
 * GLOBAL AUTH PROTECTION
 * =====================================
 * ALL alert routes require authentication
 */
router.use(authMiddleware);
router.post("/", alertsController.createAlert);
/**
 * =====================================
 * ALERT ROUTES
 * =====================================
 */

/**
 * ================= GET ALERTS =================
 * Supports:
 * - pagination
 * - filtering
 */
router.get(
    "/",
    alertsController.getAlerts
);

/**
 * ================= ALERT STATS =================
 * Dashboard analytics
 */
router.get(
    "/stats",
    alertsController.getAlertStats
);

/**
 * ================= THREAT TIMELINE =================
 */
router.get(
    "/timeline",
    alertsController.getThreatTimeline
);

/**
 * ================= SUSPICIOUS IPS =================
 */
router.get(
    "/suspicious-ips",
    alertsController.getSuspiciousIPs
);
router.get("/:id", alertsController.getAlertById);
router.patch("/:id/status", alertsController.updateAlertStatus);

/**
 * ================= RESOLVE ALERT =================
 */
router.patch(
    "/:id/resolve",
    alertsController.resolveAlert
);

export default router;