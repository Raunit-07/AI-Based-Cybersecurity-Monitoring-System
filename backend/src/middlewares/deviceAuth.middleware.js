import Device from "../models/device.model.js";
import { compareApiKey } from "../utils/deviceKey.util.js";

/**
 * ==================================================
 * DEVICE AUTH MIDDLEWARE
 * ==================================================
 *
 * Authenticates:
 * - collector agents
 * - endpoint devices
 *
 * Required Headers:
 *
 * x-device-id
 * x-device-key
 *
 * ==================================================
 */

export const deviceAuthMiddleware = async (req, res, next) => {
  try {
    /**
     * ==========================================
     * SAFE HEADER PARSING
     * ==========================================
     */

    const deviceId = String(req.headers["x-device-id"] || "").trim();

    const deviceKey = String(req.headers["x-device-key"] || "").trim();

    /**
     * ==========================================
     * REQUIRED VALIDATION
     * ==========================================
     */

    if (!deviceId || !deviceKey) {
      return res.status(401).json({
        success: false,
        data: null,
        message: "Missing device credentials",
      });
    }

    /**
     * ==========================================
     * BASIC INPUT VALIDATION
     * ==========================================
     */

    if (deviceId.length < 3 || deviceId.length > 255) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "Invalid device ID",
      });
    }

    /**
     * ==========================================
     * FIND DEVICE
     * ==========================================
     */

    const device = await Device.findOne({
      deviceId,
    }).select("+apiKey");

    /**
     * ==========================================
     * DEVICE NOT FOUND
     * ==========================================
     */

    if (!device) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Device not found",
      });
    }

    /**
     * ==========================================
     * DEVICE STATUS CHECK
     * ==========================================
     */

    const blockedStatuses = ["inactive", "quarantined"];

    if (blockedStatuses.includes(device.status) || device.isolated) {
      return res.status(403).json({
        success: false,
        data: null,
        message: "Device disabled",
      });
    }

    /**
     * ==========================================
     * SECURE API KEY COMPARISON
     * ==========================================
     */

    const isValid = compareApiKey(device.apiKey, deviceKey);

    if (!isValid) {
      return res.status(403).json({
        success: false,
        data: null,
        message: "Invalid device key",
      });
    }

    /**
     * ==========================================
     * UPDATE LAST ACTIVE
     * Avoid excessive writes
     * ==========================================
     */

    const now = Date.now();

    const lastSeen = device.lastSeen ? new Date(device.lastSeen).getTime() : 0;

    const updateInterval = 60 * 1000;

    if (now - lastSeen > updateInterval) {
      device.lastSeen = new Date();

      device.heartbeatAt = new Date();

      await device.save();
    }

    /**
     * ==========================================
     * REMOVE SENSITIVE DATA
     * ==========================================
     */

    const safeDevice = device.toObject();

    delete safeDevice.apiKey;

    /**
     * ==========================================
     * ATTACH DEVICE
     * ==========================================
     */

    req.device = safeDevice;

    return next();
  } catch (error) {
    console.error("❌ Device auth error:", error);

    return res.status(500).json({
      success: false,
      data: null,
      message: "Device authentication failed",
    });
  }
};
