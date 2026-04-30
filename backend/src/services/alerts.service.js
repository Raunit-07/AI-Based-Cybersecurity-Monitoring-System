import Alert from "../models/alert.model.js";
import { sendSlackAlert } from "../integrations/slack.js";
import { sendEmailAlert } from "../integrations/email.js";

// ================= CREATE ALERT =================
const createAlert = async (alertData) => {
  if (!alertData || !alertData.ip) {
    throw new Error("Invalid alert data");
  }

  const alert = await Alert.create({
    ip: alertData.ip,
    type: alertData.type || "unknown",
    severity: alertData.severity || "low",
    timestamp: alertData.timestamp || new Date(),
  });

  // ✅ Trigger integrations ONLY for high severity
  if (["high", "critical"].includes(alert.severity)) {
    try {
      await sendSlackAlert(alert);
      await sendEmailAlert(alert);
    } catch (err) {
      console.error("Alert integration error:", err.message);
    }
  }

  return alert;
};

// ================= GET ALERTS =================
const getAlerts = async (query = {}, options = {}) => {
  const limit = Math.min(options.limit || 50, 100);
  const skip = options.skip || 0;

  const alerts = await Alert.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean(); // ✅ performance optimization

  const total = await Alert.countDocuments(query);

  return { alerts, total };
};

export default {
  createAlert,
  getAlerts,
};