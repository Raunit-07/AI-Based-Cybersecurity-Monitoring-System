import express from "express";

import {
    registerDevice,
} from "../controllers/device.controller.js";

import {
    authMiddleware,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * ==================================================
 * HEALTH CHECK
 * ==================================================
 * Helps verify route mounting quickly
 */
router.get(
    "/health",
    (req, res) => {
        return res.status(200).json({
            success: true,

            data: {
                service: "device-routes",
                status: "healthy",
                timestamp:
                    new Date().toISOString(),
            },

            message:
                "Device routes working",
        });
    }
);

/**
 * ==================================================
 * REGISTER DEVICE
 * ==================================================
 * Protected Route
 *
 * Only authenticated users
 * can register endpoint devices.
 *
 * Future-ready for:
 * - multi-tenancy
 * - endpoint agents
 * - telemetry ingestion
 * ==================================================
 */
router.post(
    "/register",

    authMiddleware,

    registerDevice
);

export default router;