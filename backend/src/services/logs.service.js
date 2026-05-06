import Log from "../models/log.model.js";
import { createAlert } from "./alerts.service.js";
import { detectThreat } from "./mlClient.js";

// ================= VALIDATION =================
const sanitizeLogData = (data) => {
  return {
    ip: String(data.ip || "").trim(),
    requests: Math.max(0, Number(data.requests) || 0),
    failedLogins: Math.max(0, Number(data.failedLogins) || 0),
    endpoint: String(data.endpoint || "/unknown"),
    method: String(data.method || "GET"),
    timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
    user_agent: String(data.user_agent || "unknown"),
  };
};

// ================= SEVERITY =================
const getSeverity = (data, prediction) => {
  if (
    prediction.attackType === "ddos" ||
    data.requests > 2000 ||
    prediction.anomaly_score < -0.8
  ) {
    return "critical";
  }

  if (
    prediction.attackType === "bruteforce" ||
    data.failedLogins > 20 ||
    prediction.anomaly_score < -0.6
  ) {
    return "high";
  }

  if (prediction.anomaly_score < -0.4) {
    return "medium";
  }

  return "low";
};

// ================= MAIN PROCESS =================
const processLog = async (logData, io) => {
  try {
    if (!logData || !logData.ip) {
      throw new Error("Invalid log data");
    }

    const cleanData = sanitizeLogData(logData);

    // ================= ML DETECTION =================
    let prediction = {
      is_anomaly: false,
      anomaly_score: 0,
      attackType: "normal",
    };

    try {
      const mlResponse = await detectThreat({
        ip: cleanData.ip,
        requests: cleanData.requests,
        failedLogins: cleanData.failedLogins,
        method: cleanData.method,
        endpoint: cleanData.endpoint,
      });

      prediction = mlResponse?.data || mlResponse || prediction;
    } catch (error) {
      console.error("❌ ML Error:", error.message);
    }

    // ================= HYBRID DECISION =================
    const isAnomaly =
      prediction.is_anomaly === true ||
      cleanData.requests > 800 ||
      cleanData.failedLogins > 10;

    const anomalyScore = Number(prediction.anomaly_score) || 0;

    const attackType =
      cleanData.failedLogins > 10
        ? "Brute Force"
        : cleanData.requests > 800
          ? "DDoS"
          : prediction.attackType || "Suspicious";

    const severity = getSeverity(cleanData, {
      ...prediction,
      attackType: attackType.toLowerCase(),
    });

    // ================= SAVE LOG =================
    const log = await Log.create({
      ...cleanData,
      is_anomaly: isAnomaly,
      anomaly_score: anomalyScore,
      attackType: attackType,
    });

    // ================= ALERT (CLEAN PIPELINE) =================
    let alert = null;

    if (isAnomaly) {
      alert = await createAlert(
        {
          ip: log.ip,
          anomalyScore,
          attackType,
          severity,
          requests: log.requests,
          failedLogins: log.failedLogins,
          timestamp: new Date(),
        },
        io // 🔥 IMPORTANT: pass socket here
      );
    }

    // ================= REAL-TIME TRAFFIC =================
    if (io) {
      io.emit("traffic_update", {
        requests: log.requests,
        timestamp: Date.now(),
      });
    }

    return {
      log,
      mlResult: {
        is_anomaly: isAnomaly,
        anomaly_score: anomalyScore,
        attackType: attackType,
        severity,
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