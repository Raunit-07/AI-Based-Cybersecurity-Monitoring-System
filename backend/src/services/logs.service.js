import Log from "../models/log.model.js";
import { createAlert } from "./alerts.service.js";
import { detectThreat } from "./mlClient.js";
import { sendSlackAlert } from "../integrations/slack.js";
import { sendEmailAlert } from "../integrations/email.js";

// ================= VALIDATION =================
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

// ================= SEVERITY =================
const getSeverity = (data, prediction) => {
  if (
    prediction.attack_type === "ddos" ||
    data.requests > 2000 ||
    prediction.anomaly_score > 0.8
  ) {
    return "high";
  }

  if (
    prediction.attack_type === "bruteforce" ||
    data.failedLogins > 20
  ) {
    return "medium";
  }

  return "low";
};

// ================= MAIN PROCESS =================
const processLog = async (logData, io) => {
  try {
    console.log("📥 Incoming Log:", logData);

    if (!logData || !logData.ip) {
      throw new Error("Invalid log data");
    }

    const cleanData = sanitizeLogData(logData);

    // ================= ML DETECTION =================
    let prediction = {
      is_anomaly: false,
      anomaly_score: 0,
      attack_type: "normal",
    };

    try {
      const mlResponse = await detectThreat({
        ip: cleanData.ip,
        requests: cleanData.requests,
        failedLogins: cleanData.failedLogins,
        method: cleanData.method,
        endpoint: cleanData.endpoint,
      });

      prediction = mlResponse.data || mlResponse;

      console.log("🧠 ML Result:", prediction);
    } catch (error) {
      console.error("❌ ML Error:", error.message);
    }

    // ================= HYBRID DECISION =================
    const isAnomaly =
      prediction.is_anomaly === true ||
      cleanData.requests > 800 ||
      cleanData.failedLogins > 10;

    const anomalyScore = prediction.anomaly_score || 0;

    const attackType =
      cleanData.failedLogins > 10
        ? "bruteforce"
        : cleanData.requests > 800
          ? "ddos"
          : prediction.attack_type || "suspicious";

    const severity = getSeverity(cleanData, {
      ...prediction,
      attack_type: attackType,
    });

    console.log("🚨 Final Decision:", {
      isAnomaly,
      anomalyScore,
      attackType,
      severity,
    });

    // ================= SAVE LOG =================
    const log = await Log.create({
      ...cleanData,
      is_anomaly: isAnomaly,
      anomaly_score: anomalyScore,
      attack_type: attackType,
    });

    // ================= ALERT =================
    let alert = null;

    if (isAnomaly) {
      const alertPayload = {
        ip: log.ip,
        attack_type: attackType,
        severity,
        requests: log.requests,
        failedLogins: log.failedLogins,
        anomaly_score: anomalyScore,
        timestamp: new Date(),
      };

      // DB Alert
      alert = await createAlert({
        ip: alertPayload.ip,
        type: alertPayload.attack_type,
        severity: alertPayload.severity,
        timestamp: alertPayload.timestamp,
      });

      console.log("🔥 Alert Created:", alert);

      // ================= EXTERNAL ALERTS =================
      await sendSlackAlert(alertPayload);
      await sendEmailAlert(alertPayload);

      // ================= SOCKET =================
      if (io) {
        io.emit("new-alert", alert);
      }
    }

    // ================= REAL-TIME =================
    if (io) {
      io.emit("new_log", log);

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