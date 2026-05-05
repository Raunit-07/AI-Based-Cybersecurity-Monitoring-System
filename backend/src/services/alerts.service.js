import Alert from "../models/alert.model.js";
import { sendSlackAlert } from "../integrations/slack.js";
import { sendEmailAlert } from "../integrations/email.js";
import validator from "validator";

// ================= CREATE ALERT =================
const createAlert = async (alertData = {}, io = null) => {
  try {
    // 🔒 VALIDATION
    if (!alertData.ip || !validator.isIP(String(alertData.ip))) {
      throw new Error("Invalid or missing IP address");
    }

    // 🔒 SANITIZE INPUT
    const ip = String(alertData.ip).trim();

    const anomalyScore = Number(alertData.anomalyScore ?? 0);

    const attackType = alertData.attackType || "Suspicious";

    // normalize type for your system
    const normalizedType =
      attackType.toLowerCase().replace(/\s+/g, "") || "unknown";

    // 🔥 AUTO SEVERITY BASED ON ML SCORE
    const severity =
      alertData.severity ||
      (anomalyScore < -0.8
        ? "critical"
        : anomalyScore < -0.6
          ? "high"
          : anomalyScore < -0.4
            ? "medium"
            : "low");

    // ✅ SAVE ALERT
    const alert = await Alert.create({
      ip,
      anomalyScore,
      attackType,

      // keep backward compatibility
      type: alertData.type || normalizedType,
      severity,

      meta: {
        requests: alertData.requests || 0,
        failedLogins: alertData.failedLogins || 0,
      },

      timestamp: alertData.timestamp || new Date(),
    });

    // ✅ SOCKET EMIT AFTER DB SAVE
    if (io) {
      io.emit("new_alert", alert);
    }

    // 🔥 SAFE ALERT INTEGRATIONS
    if (["high", "critical"].includes(alert.severity)) {
      await Promise.allSettled([
        sendSlackAlert(alert),
        sendEmailAlert(alert),
      ]);
    }

    return alert;
  } catch (error) {
    console.error("❌ createAlert error:", error.message);
    throw error;
  }
};

// ================= GET ALERTS =================
const getAlerts = async (query = {}, options = {}) => {
  try {
    const limit = Math.min(Number(options.limit) || 50, 100);
    const skip = Math.max(Number(options.skip) || 0, 0);

    const alerts = await Alert.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Alert.countDocuments(query);

    return {
      success: true,
      data: alerts,
      total,
    };
  } catch (error) {
    console.error("❌ getAlerts error:", error.message);
    throw error;
  }
};

// ================= RESOLVE ALERT =================
const resolveAlert = async (alertId) => {
  try {
    if (!alertId) throw new Error("Alert ID required");

    const alert = await Alert.findByIdAndUpdate(
      alertId,
      { resolved: true },
      { new: true }
    );

    return alert;
  } catch (error) {
    console.error("❌ resolveAlert error:", error.message);
    throw error;
  }
};

// ================= EXPORTS =================
export { createAlert, getAlerts, resolveAlert };