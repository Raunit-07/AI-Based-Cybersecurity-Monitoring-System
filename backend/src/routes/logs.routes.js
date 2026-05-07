import express from "express";

import {
    createLog,
    getLogs,
} from "../controllers/logs.controller.js";

import { apiKeyAuth } from "../middlewares/apiKeyAuth.js";

import {
    logValidator,
} from "../validators/log.validator.js";

import validate from "../middlewares/validate.middleware.js";

import {
    authMiddleware,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * =====================================
 * LOG INGESTION ROUTE
 * =====================================
 *
 * Only authenticated systems/devices
 * can send logs using personal API keys.
 *
 * Flow:
 * System → x-api-key → apiKeyAuth
 * → validate payload → create log
 */
router.post(
    "/",
    apiKeyAuth,
    logValidator,
    validate,
    createLog
);

/**
 * =====================================
 * FETCH USER LOGS
 * =====================================
 *
 * Protected dashboard route.
 * Only logged-in users can access.
 */
router.get(
    "/",
    authMiddleware,
    getLogs
);

export default router;