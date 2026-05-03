import Alert from "../models/alert.model.js";
import { sendSlackAlert } from "../integrations/slack.js";
import { sendEmailAlert } from "../integrations/email.js";

// ================= CREATE ALERT =================
const createAlert = async (alertData) => {
  if (!alertData || !alertData.ip) {
    throw new Error("Invalid alert data");
  }

  // basic sanitization
  const ip = String(alertData.ip).trim();

  const alert = await Alert.create({
    ip,
    type: alertData.type || "unknown",
    severity: alertData.severity || "low",
    timestamp: alertData.timestamp || new Date(),
  });

  // Trigger integrations only for higher severity
  if (["high", "critical"].includes(alert.severity)) {
    try {
      await Promise.all([
        sendSlackAlert(alert),
        sendEmailAlert(alert),
      ]);
    } catch (err) {
      console.error("⚠️ Alert integration error:", err.message);
      // do NOT throw — alert already created
    }
  }

  return alert;
};

// ================= GET ALERTS =================
const getAlerts = async (query = {}, options = {}) => {
  const limit = Math.min(Number(options.limit) || 50, 100);
  const skip = Number(options.skip) || 0;

  const alerts = await Alert.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Alert.countDocuments(query);

  return { alerts, total };
};

// ✅ NAMED EXPORTS
export { createAlert, getAlerts };