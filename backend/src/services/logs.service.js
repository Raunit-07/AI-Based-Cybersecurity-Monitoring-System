import Log from "../models/log.model.js";
import Alert from "../models/alert.model.js";
import { detectThreat } from "./mlClient.js";

// ================= PROCESS LOG =================
const processLog = async (logData, io) => {
  try {
    // ✅ Basic validation safeguard
    if (!logData || !logData.ip) {
      throw new Error("Invalid log data");
    }

    // ================= SAVE LOG =================
    const log = await Log.create({
      ip: logData.ip,
      requests: logData.requests || 0,
      failedLogins: logData.failedLogins || 0,
      endpoint: logData.endpoint || "/unknown",
      method: logData.method || "GET",
      timestamp: logData.timestamp || new Date(),
      user_agent: logData.user_agent || "unknown",
    });

    // ================= ML DETECTION =================
    let mlResult = {
      is_anomaly: false,
      anomaly_score: 0,
      attack_type: "normal",
    };

    try {
      mlResult = await detectThreat({
        ip: log.ip,
        requests: log.requests,
        failedLogins: log.failedLogins,
      });
    } catch (error) {
      console.error("ML Error:", error.message);
      // fallback keeps system running
    }

    let alert = null;

    // ================= ALERT GENERATION =================
    if (mlResult.is_anomaly) {
      alert = await Alert.create({
        ip: log.ip,
        type: mlResult.attack_type || "suspicious",
        severity:
          mlResult.anomaly_score > 0.8 ? "critical" : "high",
        timestamp: new Date(),
      });

      // 🔥 Emit real-time alert
      if (io) {
        io.emit("new-alert", alert);
      }
    }

    // ================= TRAFFIC UPDATE =================
    if (io) {
      io.emit("traffic_update", {
        ip: log.ip,
        requests: log.requests,
        timestamp: Date.now(),
      });
    }

    return {
      log,
      mlResult,
      alert,
    };
  } catch (error) {
    console.error("processLog Error:", error.message);
    throw error;
  }
};

export default {
  processLog,
};