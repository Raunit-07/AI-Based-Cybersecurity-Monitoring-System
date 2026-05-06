import express from "express";
import alertsController from "../controllers/alerts.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * ================= ALERT ROUTES =================
 * All routes are protected (auth required)
 */

// ✅ Get alerts (pagination + filtering)
router.get(
    "/suspicious-ips",
    alertsController.getSuspiciousIPs
);
router.get("/", authMiddleware, alertsController.getAlerts);
router.get("/timeline", alertsController.getThreatTimeline);


// ✅ Resolve alert
router.patch(
    "/:id/resolve",
    authMiddleware,
    alertsController.resolveAlert
);

// ✅ Suspicious IPs
router.get(
    "/suspicious-ips",
    authMiddleware,
    alertsController.getSuspiciousIPs
);

export default router;