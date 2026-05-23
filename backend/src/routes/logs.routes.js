import express from "express";

import { createLog, getLogs } from "../controllers/logs.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";

import { deviceAuthMiddleware } from "../middlewares/deviceAuth.middleware.js";

import validate from "../middlewares/validate.middleware.js";
import { logValidator } from "../validators/log.validator.js";

import normalizeLogs from "../middlewares/normalizeLogs.middleware.js";

const router = express.Router();

/*
==================================================
TELEMETRY INGESTION
==================================================

Agent

↓
Device Auth

↓
Validation

↓
Normalization

↓
Queue

↓
Controller

==================================================
*/

router.post(
  "/",

  deviceAuthMiddleware,

  validate(logValidator),

  normalizeLogs,

  createLog,
);

/*
==================================================
DASHBOARD LOGS
==================================================

Dashboard user

↓
JWT Auth

↓
Controller

==================================================
*/

router.get(
  "/",

  authMiddleware,

  getLogs,
);

export default router;
