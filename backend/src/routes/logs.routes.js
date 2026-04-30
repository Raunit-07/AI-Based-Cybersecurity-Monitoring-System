import express from "express";
const router = express.Router();

import logsController from "../controllers/logs.controller.js";
import { logValidator } from "../validators/log.validator.js";
import validate from "../middlewares/validate.middleware.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

// 🚨 PUBLIC route (for simulation)
router.post("/", logValidator, validate, logsController.ingestLog);

// 🔐 Protected route
router.get("/", authMiddleware, logsController.getLogs);

export default router;