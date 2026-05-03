import Log from "../models/log.model.js";
import { createAlert } from "./alerts.service.js";
import { detectThreat } from "./mlClient.js";

// ================= VALIDATION HELPER =================
const sanitizeLogData = (data) => {
  return {
    ip: String(data.ip || "").trim(),
    requests: Number(data.requests) || 0,
    failedLogins: Number(data.failedLogins) || 0,
    endpoint: String(data.endpoint || "/unknown"),
    method: String(data.method || "GET"),
    timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
    user_agent: String(data.user_agent || "unknown"),
  };
};

// ================= PROCESS LOG =================
const processLog = async (logData, io) => {
  try {
    // ✅ Debug: incoming data
    console.log("📥 Incoming Log:", logData);

    // ✅ Validate input
    if (!logData || !logData.ip) {
      throw new Error("Invalid log data");
    }

    const cleanData = sanitizeLogData(logData);

    // ================= SAVE LOG =================
    const log = await Log.create(cleanData);

    // ================= ML DETECTION =================
    let mlData = {
      is_anomaly: false,
      anomaly_score: 0,
      attack_type: "normal",
    };

    try {
      const mlResponse = await detectThreat({
        ip: log.ip,
        requests: log.requests,
        failedLogins: log.failedLogins,
      });

      console.log("🧠 ML RAW:", mlResponse);

      // Handle both axios and direct return formats
      mlData = mlResponse?.data || mlResponse || mlData;
    } catch (error) {
      console.error("❌ ML Error:", error.message);
    }

    // ================= HYBRID DETECTION =================
    const isAnomaly =
      mlData.is_anomaly === true ||
      mlData.anomaly_score > 0.6 ||
      log.requests > 800 ||
      log.failedLogins > 10;

    console.log("🚨 Is Anomaly:", isAnomaly);

    const anomalyScore = mlData.anomaly_score || 0;

    const attackType =
      log.failedLogins > 10
        ? "bruteforce"
        : log.requests > 800
        ? "ddos"
        : mlData.attack_type || "suspicious";

    let alert = null;

    // ================= ALERT CREATION =================
    if (isAnomaly) {
      alert = await createAlert({
        ip: log.ip,
        type: attackType,
        severity:
          anomalyScore > 0.8
            ? "critical"
            : log.failedLogins > 10
            ? "high"
            : "medium",
        timestamp: new Date(),
      });

      console.log("🔥 Alert Created:", alert);

      // ✅ Emit alert to frontend
      if (io) {
        io.emit("new-alert", alert);
      }
    }

    // ================= TRAFFIC UPDATE =================
    if (io) {
      io.emit("traffic_update", {
        timestamp: Date.now(),
        requests: log.requests,
      });
    }

    return {
      log,
      mlResult: {
        is_anomaly: isAnomaly,
        anomaly_score: anomalyScore,
        attack_type: attackType,
      },
      alert,
    };
  } catch (error) {
    console.error("❌ processLog Error:", error.message);
    throw error;
  }
};

export default {
  processLog,
};