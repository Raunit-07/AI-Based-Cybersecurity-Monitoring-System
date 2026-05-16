import express from "express";

import {
    registerDevice,
    heartbeatDevice,
    getDevices,
} from "../controllers/device.controller.js";

import {
    authMiddleware,
} from "../middlewares/auth.middleware.js";

import {
    deviceAuthMiddleware,
} from "../middlewares/deviceAuth.middleware.js";

const router =
    express.Router();

/**
 * ==================================================
 * HEALTH CHECK
 * ==================================================
 * Used for:
 * - Render health monitoring
 * - Docker healthcheck
 * - API verification
 * ==================================================
 */
router.get(
    "/health",

    (req, res) => {
        return res.status(200).json({
            success: true,

            data: {
                service:
                    "device-routes",

                status:
                    "healthy",

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
 * Browser-authenticated users
 * can register endpoint devices.
 *
 * Used during:
 * - first-time device enrollment
 * - endpoint onboarding
 * ==================================================
 */
router.post(
    "/register",

    authMiddleware,

    registerDevice
);

/**
 * ==================================================
 * DEVICE HEARTBEAT
 * ==================================================
 * Used by:
 * - collector-agent
 * - endpoint daemon
 *
 * Auth:
 * x-device-key
 * ==================================================
 */
router.post(
    "/heartbeat",

    deviceAuthMiddleware,

    heartbeatDevice
);

/**
 * ==================================================
 * GET USER DEVICES
 * ==================================================
 * Returns ONLY devices
 * belonging to authenticated user.
 *
 * Multi-tenant safe.
 * ==================================================
 */
router.get(
    "/",

    authMiddleware,

    getDevices
);

export default router;