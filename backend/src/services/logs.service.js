import Log from "../models/log.model.js";

import { createAlert } from "./alerts.service.js";

import { detectThreat } from "./mlClient.js";

import logger from "../utils/logger.js";

/**
 * ================= NORMALIZE ATTACK TYPE =================
 */
const normalizeAttackType = (type) => {
  if (!type) return "Normal";

  const t = String(type).toLowerCase().trim();

  if (t.includes("ddos")) return "DDoS";

  if (t.includes("brute") || t.includes("force"))
    return "Brute Force";

  if (t.includes("scan") || t.includes("port"))
    return "Port Scan";

  if (t.includes("sql") || t.includes("inject"))
    return "SQL Injection";

  if (t.includes("xss")) return "XSS";

  if (t.includes("malware")) return "Malware";

  if (t.includes("suspicious"))
    return "Suspicious";

  if (t.includes("normal")) return "Normal";

  return "Suspicious";
};


/**
 * ================= ALLOWED ATTACK TYPES =================
 */
const allowedAttackTypes = [
  "DDoS",

  "Brute Force",

  "Port Scan",

  "SQL Injection",

  "XSS",

  "Malware",

  "Suspicious",

  "Normal",
];

/**
 * ================= SANITIZE LOG DATA =================
 */
const sanitizeLogData = (data) => {
  return {
    ip: String(data.ip || "").trim(),

    requests: Math.max(
      0,
      Number(data.requests) || 0
    ),

    failedLogins: Math.max(
      0,
      Number(data.failedLogins) || 0
    ),

    endpoint: String(
      data.endpoint || "/unknown"
    ),

    method: String(data.method || "GET"),

    timestamp: data.timestamp
      ? new Date(data.timestamp)
      : new Date(),

    user_agent: String(
      data.user_agent || "unknown"
    ),
  };
};

/**
 * ================= DETERMINE SEVERITY =================
 */
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

/**
 * ================= MAIN PROCESS =================
 * Multi-user SaaS safe
 */
const processLog = async (
  logData,
  io,
  userId
) => {
  try {
    /**
     * ================= VALIDATION =================
     */
    if (!logData || !logData.ip) {
      throw new Error("Invalid log data");
    }

    if (!userId) {
      throw new Error(
        "Missing userId in processLog"
      );
    }

    const cleanData =
      sanitizeLogData(logData);

    /**
     * ================= ML DETECTION =================
     */
    let prediction = {
      is_anomaly: false,
      anomaly_score: 0,
      attackType: "normal",
    };

    try {
      const mlResponse =
        await detectThreat({
          ip: cleanData.ip,

          requests:
            cleanData.requests,

          failedLogins:
            cleanData.failedLogins,

          method:
            cleanData.method,

          endpoint:
            cleanData.endpoint,
        });

      prediction =
        mlResponse?.data ||
        mlResponse ||
        prediction;
    } catch (error) {
      logger.error(
        `❌ ML Error: ${error.message}`
      );
    }

    /**
     * ================= HYBRID DETECTION =================
     */
    const isAnomaly =
      prediction.is_anomaly === true ||
      cleanData.requests > 800 ||
      cleanData.failedLogins > 10;

    const anomalyScore =
      Number(
        prediction.anomaly_score
      ) || 0;

    /**
     * ================= DETERMINE ATTACK TYPE =================
     */
    let rawAttackType =
      "Normal";

    if (
      cleanData.failedLogins > 10
    ) {
      rawAttackType =
        "Brute Force";
    } else if (
      cleanData.requests > 800
    ) {
      rawAttackType = "DDoS";
    } else if (
      prediction.attackType &&
      prediction.attackType !==
      "normal"
    ) {
      rawAttackType =
        prediction.attackType;
    } else if (isAnomaly) {
      rawAttackType =
        "Suspicious";
    }

    const attackType =
      normalizeAttackType(
        rawAttackType
      );

    const severity =
      getSeverity(cleanData, {
        ...prediction,

        attackType:
          attackType
            .toLowerCase()
            .replace(/\s+/g, ""),
      });

    /**
     * ================= SAVE LOG =================
     */
    const log =
      await Log.create({
        ...cleanData,

        user: userId,

        is_anomaly:
          isAnomaly,

        anomaly_score:
          anomalyScore,

        attackType,
      });

    /**
     * ================= CREATE ALERT =================
     *
     * IMPORTANT:
     * alerts.service.js handles:
     * - socket emissions
     * - traffic_update events
     * - real-time updates
     *
     * DO NOT emit traffic here
     * to prevent duplicate frontend events.
     */
    let alert = null;

    if (isAnomaly) {
      alert =
        await createAlert(
          {
            ip: log.ip,

            anomalyScore,

            attackType,

            severity,

            requests:
              log.requests,

            failedLogins:
              log.failedLogins,

            timestamp:
              new Date(),
          },

          io,

          userId
        );
    }

    logger.info(
      `✅ Log processed for user: ${userId}`
    );

    return {
      log,

      mlResult: {
        is_anomaly:
          isAnomaly,

        anomaly_score:
          anomalyScore,

        attackType,

        severity,
      },

      alert,
    };
  } catch (error) {
    logger.error(
      `❌ processLog Error: ${error.message}`
    );

    throw error;
  }
};


/**
 * ================= GET USER LOGS =================
 * Multi-user safe historical logs
 */
const getLogs = async (
  userId,
  options = {}
) => {
  try {
    if (!userId) {
      throw new Error(
        "User ID is required"
      );
    }

    // ================= PAGINATION =================
    const limit = Math.min(
      Number(options.limit) || 100,
      500
    );

    const page = Math.max(
      Number(options.page) || 1,
      1
    );

    const skip =
      (page - 1) * limit;

    // ================= FILTERS =================
    const query = {
      user: userId,
    };

    if (
      options.attackType &&
      allowedAttackTypes.includes(
        options.attackType
      )
    ) {
      query.attackType =
        options.attackType;
    }

    if (
      typeof options.is_anomaly !==
      "undefined"
    ) {
      query.is_anomaly =
        options.is_anomaly;
    }

    // ================= FETCH LOGS =================
    const logs =
      await Log.find(query)
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean();

    // ================= TOTAL =================
    const total =
      await Log.countDocuments(
        query
      );

    return {
      logs,

      pagination: {
        total,

        page,

        limit,

        pages: Math.ceil(
          total / limit
        ),
      },
    };
  } catch (error) {
    logger.error(
      `❌ getLogs Error: ${error.message}`
    );

    throw error;
  }
};


export default {
  processLog,

  getLogs,
};