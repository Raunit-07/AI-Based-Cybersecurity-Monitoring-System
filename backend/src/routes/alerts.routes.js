import express from "express";
import alertsController from "../controllers/alerts.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// GET all alerts
router.get("/", authMiddleware, alertsController.getAlerts);

export default router;