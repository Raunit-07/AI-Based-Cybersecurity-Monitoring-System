import express from "express";

import {
    getDeviceById,
    getDevices,
    heartbeatDevice,
    registerDevice,
    updateDevice,
} from "../controllers/device.controller.js";

import {
    authMiddleware,
} from "../middlewares/auth.middleware.js";

import {
    deviceAuthMiddleware,
} from "../middlewares/deviceAuth.middleware.js";

import { apiKeyAuth } from "../middlewares/apiKeyAuth.js";

const router =
    express.Router();

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


router.post(
   "/register",
   apiKeyAuth,
   registerDevice
);

router.post(
    "/heartbeat",

    deviceAuthMiddleware,

    heartbeatDevice
);

router.get(
    "/:id",
    authMiddleware,
    getDeviceById
);

router.patch(
    "/:id",
    authMiddleware,
    updateDevice
);

router.get(
    "/",
    authMiddleware,
    getDevices
);

export default router;