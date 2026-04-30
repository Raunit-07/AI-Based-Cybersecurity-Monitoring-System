import Log from "../models/log.model.js";
import Alert from "../models/alert.model.js";
import { detectThreat } from "./mlClient.js";

// ================= PROCESS LOG =================
const processLog = async (logData, io) => {
  try {
    // ✅ Validation
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
    let mlRaw = null;

    try {
      mlRaw = await detectThreat({
        ip: log.ip,
        requests: log.requests,
        failedLogins: log.failedLogins,
      });

      console.log("ML RESULT:", mlRaw);
    } catch (error) {
      console.error("ML Error:", error.message);
    }

    // ================= NORMALIZE ML =================
    const mlData = mlRaw?.data || {};

    // 🔥 HYBRID DETECTION (IMPORTANT)
    const isAnomaly =
      mlData.is_anomaly === true ||
      mlData.anomaly_score > 0.6 ||
      log.requests > 800 ||          // DDoS rule
      log.failedLogins > 10;         // Brute-force rule

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
      alert = await Alert.create({
        ip: log.ip,
        type: attackType,
        severity: anomalyScore > 0.8 ? "critical" : "high",
        timestamp: new Date(),
      });

      // 🔥 Real-time emit
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
      mlResult: {
        is_anomaly: isAnomaly,
        anomaly_score: anomalyScore,
        attack_type: attackType,
      },
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