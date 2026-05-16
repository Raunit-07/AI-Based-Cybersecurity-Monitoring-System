import express from "express";

import {
    createLog,
    getLogs,
} from "../controllers/logs.controller.js";

import {
    authMiddleware,
} from "../middlewares/auth.middleware.js";

import {
    deviceAuthMiddleware,
} from "../middlewares/deviceAuth.middleware.js";

const router = express.Router();

/**
 * ==================================================
 * CREATE LOGS / TELEMETRY INGESTION
 * ==================================================
 *
 * Protected using:
 * - x-device-id
 * - x-device-key
 *
 * Only registered endpoint agents
 * can send telemetry/logs.
 *
 * Future-ready for:
 * - endpoint monitoring
 * - EDR architecture
 * - multi-device telemetry
 * - SOC pipelines
 * ==================================================
 */
router.post(
    "/",

    deviceAuthMiddleware,

    async (req, res, next) => {
        try {

            /**
             * ==================================================
             * NORMALIZE PAYLOAD
             * ==================================================
             */
            const logs =
                Array.isArray(req.body.logs)
                    ? req.body.logs
                    : [req.body];

            /**
             * ==================================================
             * EMPTY CHECK
             * ==================================================
             */
            if (!logs.length) {
                return res.status(400).json({
                    success: false,

                    data: null,

                    message:
                        "No logs provided",
                });
            }

            /**
             * ==================================================
             * VALIDATE + NORMALIZE EACH LOG
             * ==================================================
             */
            for (const log of logs) {

                /**
                 * ================= REQUIRED =================
                 */
                if (!log.ip) {
                    return res.status(400).json({
                        success: false,

                        data: null,

                        message:
                            "Valid IP address is required",
                    });
                }

                if (!log.endpoint) {
                    return res.status(400).json({
                        success: false,

                        data: null,

                        message:
                            "Endpoint is required",
                    });
                }

                if (!log.method) {
                    return res.status(400).json({
                        success: false,

                        data: null,

                        message:
                            "HTTP method is required",
                    });
                }

                /**
                 * ==================================================
                 * NORMALIZATION
                 * ==================================================
                 */
                log.requests =
                    Number(log.requests || 1);

                log.statusCode =
                    Number(log.statusCode || 200);

                log.bytes =
                    Number(log.bytes || 0);

                log.failedLogins =
                    Number(
                        log.failedLogins || 0
                    );

                log.timestamp =
                    log.timestamp ||
                    new Date().toISOString();

                /**
                 * ==================================================
                 * SAFE OPTIONALS
                 * ==================================================
                 */
                log.user_agent =
                    String(
                        log.user_agent ||
                        "Unknown"
                    );

                log.referrer =
                    String(
                        log.referrer || "-"
                    );

                /**
                 * ==================================================
                 * ATTACH DEVICE CONTEXT
                 * ==================================================
                 *
                 * Critical for:
                 * - multi-device support
                 * - telemetry ownership
                 * - future SaaS isolation
                 * ==================================================
                 */
                log.deviceId =
                    req.device.deviceId;

                log.userId =
                    req.device.userId;

                log.organizationId =
                    req.device.organizationId ||
                    null;
            }

            /**
             * ==================================================
             * ATTACH TO REQUEST
             * ==================================================
             */
            req.logs = logs;

            next();

        } catch (error) {

            console.error(
                "❌ Log normalization error:",
                error.message
            );

            return res.status(500).json({
                success: false,

                data: null,

                message:
                    "Log ingestion failed",
            });
        }
    },

    createLog
);

/**
 * ==================================================
 * GET LOGS
 * ==================================================
 *
 * Protected dashboard route.
 *
 * Future:
 * - tenant filtering
 * - organization isolation
 * - RBAC
 * ==================================================
 */
router.get(
    "/",

    deviceAuthMiddleware,

    getLogs
);

export default router;