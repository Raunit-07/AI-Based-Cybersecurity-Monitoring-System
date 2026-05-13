import express from "express";

import {
    createLog,
    getLogs,
} from "../controllers/logs.controller.js";

import {
    apiKeyAuth,
} from "../middlewares/apiKeyAuth.js";

import {
    authMiddleware,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

import {
    deviceAuth,
} from "../middlewares/deviceAuth.middleware.js";

/**
 * ==================================================
 * CREATE LOGS
 * ==================================================
 */
router.post(
    "/",

    deviceAuth,

    async (req, res, next) => {
        console.log("DEBUG: POST /api/logs hit");
        console.log("DEBUG: Body:", JSON.stringify(req.body, null, 2));
        try {

            /**
             * ============================================
             * NORMALIZE PAYLOAD
             * ============================================
             */
            const logs =
                Array.isArray(req.body.logs)
                    ? req.body.logs
                    : [req.body];

            /**
             * EMPTY CHECK
             */
            if (!logs.length) {
                return res.status(400).json({
                    success: false,
                    message: "No logs provided",
                });
            }

            /**
             * ============================================
             * BASIC NORMALIZATION
             * ============================================
             */
            for (const log of logs) {

                /**
                 * REQUIRED FIELDS
                 */
                if (!log.ip) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Valid IP address is required",
                    });
                }

                if (!log.endpoint) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Endpoint is required",
                    });
                }

                if (!log.method) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "HTTP Method is required",
                    });
                }

                /**
                 * DEFAULT VALUES
                 */
                log.requests =
                    Number(log.requests || 1);

                log.statusCode =
                    Number(log.statusCode || 200);

                log.bytes =
                    Number(log.bytes || 0);

                log.timestamp =
                    log.timestamp ||
                    new Date().toISOString();

                /**
                 * OPTIONAL FIELDS
                 */
                log.user_agent =
                    log.user_agent || "Unknown";

                log.referrer =
                    log.referrer || "-";
            }

            /**
             * ============================================
             * ATTACH NORMALIZED LOGS
             * ============================================
             */
            req.logs = logs;

            next();

        } catch (error) {

            return res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },

    createLog
);

/**
 * ==================================================
 * GET LOGS
 * ==================================================
 */
router.get(
    "/",

    authMiddleware,

    getLogs
);

export default router;