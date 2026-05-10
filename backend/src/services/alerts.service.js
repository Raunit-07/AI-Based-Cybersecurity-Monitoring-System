import Alert from "../models/alert.model.js";
import User from "../models/User.js";

import { sendSlackAlert } from "../integrations/slack.js";
import { sendEmailAlert } from "../integrations/email.js";

import validator from "validator";

import logger from "../utils/logger.js";

/**
 * ================= NORMALIZE ATTACK TYPE =================
 */
const normalizeAttackType = (type) => {
  if (!type) return "Suspicious";

  const t = String(type)
    .toLowerCase()
    .trim();

  if (t.includes("ddos")) return "DDoS";

  if (
    t.includes("brute") ||
    t.includes("force")
  ) {
    return "Brute Force";
  }

  if (
    t.includes("scan") ||
    t.includes("port")
  ) {
    return "Port Scan";
  }

  if (
    t.includes("sql") ||
    t.includes("inject")
  ) {
    return "SQL Injection";
  }

  if (t.includes("xss")) return "XSS";

  if (t.includes("malware"))
    return "Malware";

  if (
    t.includes("suspicious")
  ) {
    return "Suspicious";
  }

  if (t.includes("normal"))
    return "Normal";

  return "Suspicious";
};

/**
 * ================= CREATE ALERT =================
 * Multi-user SaaS safe
 */
const createAlert = async (
  alertData = {},
  io = null,
  userId = null
) => {
  try {
    /**
     * ================= VALIDATION =================
     */
    if (!userId) {
      throw new Error(
        "Missing alert owner"
      );
    }

    if (
      !alertData.ip ||
      !validator.isIP(
        String(alertData.ip)
      )
    ) {
      throw new Error(
        "Invalid or missing IP address"
      );
    }

    /**
     * ================= SANITIZE =================
     */
    const ip = String(
      alertData.ip
    ).trim();

    const anomalyScore = Number(
      alertData.anomalyScore ?? 0
    );

    const attackType =
      normalizeAttackType(
        alertData.attackType
      );

    const normalizedType =
      attackType
        .toLowerCase()
        .replace(/\s+/g, "") ||
      "unknown";

    /**
     * ================= AUTO SEVERITY =================
     */
    const severity =
      alertData.severity ||
      (anomalyScore > 0.8
        ? "critical"
        : anomalyScore > 0.6
          ? "high"
          : anomalyScore > 0.4
            ? "medium"
            : "low");

    /**
     * ================= CREATE ALERT =================
     */
    const alert =
      await Alert.create({
        user: userId,

        ip,

        anomalyScore,

        attackType,

        type:
          alertData.type ||
          normalizedType,

        severity,

        meta: {
          requests:
            Number(
              alertData.requests
            ) || 0,

          failedLogins:
            Number(
              alertData.failedLogins
            ) || 0,
        },

        timestamp:
          alertData.timestamp ||
          new Date(),
      });

    /**
 * ================= SOCKET EVENTS =================
 * Emits ONLY alert events.
 *
 * traffic_update events are handled
 * centrally inside logs.service.js
 * to prevent duplicate realtime events.
 */
    if (io && typeof io.to === "function") {
      const roomId =
        userId.toString();

      /**
       * ============================================
       * SAFE ALERT PAYLOAD
       * ============================================
       */
      const alertPayload = {
        id: alert._id.toString(),

        user: userId,

        ip: alert.ip,

        attackType:
          alert.attackType,

        anomalyScore:
          alert.anomalyScore,

        severity:
          alert.severity,

        timestamp:
          alert.timestamp,

        meta: {
          requests:
            alert.meta?.requests || 0,

          failedLogins:
            alert.meta?.failedLogins || 0,
        },

        status: "active",
      };

      /**
       * ============================================
       * REALTIME ALERT EVENT
       * ============================================
       */
      io.to(roomId).emit(
        "new_alert",
        alertPayload
      );

      logger.info(
        `📡 Alert emitted to room: ${roomId}`
      );
    }



    /**
     * ================= ALERT INTEGRATIONS =================
     */
    if (
      ["high", "critical"].includes(
        alert.severity
      )
    ) {
      try {
        const user =
          await User.findById(
            userId
          ).lean();

        await Promise.allSettled([
          sendSlackAlert(alert),

          sendEmailAlert({
            ...alert.toObject(),

            recipientEmail:
              user?.email || null,
          }),
        ]);
      } catch (integrationError) {
        logger.error(
          `❌ Alert integration error: ${integrationError.message}`
        );
      }
    }

    logger.info(
      `✅ Alert created for user: ${userId}`
    );

    return alert;
  } catch (error) {
    logger.error(
      `❌ createAlert error: ${error.message}`
    );

    throw error;
  }
};

/**
 * ================= GET ALERTS =================
 * Enforced tenant isolation
 */
const getAlerts = async (
  userId,
  query = {},
  options = {}
) => {
  try {
    if (!userId) {
      throw new Error(
        "Missing userId"
      );
    }

    const limit = Math.min(
      Number(options.limit) || 50,
      100
    );

    const skip = Math.max(
      Number(options.skip) || 0,
      0
    );

    /**
     * ================= FORCE TENANT FILTER =================
     */
    const safeQuery = {
      ...query,

      user: userId,
    };

    const alerts =
      await Alert.find(safeQuery)
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean();

    const total =
      await Alert.countDocuments(
        safeQuery
      );

    return {
      success: true,

      data: alerts,

      total,
    };
  } catch (error) {
    logger.error(
      `❌ getAlerts error: ${error.message}`
    );

    throw error;
  }
};

/**
 * ================= RESOLVE ALERT =================
 * Tenant-safe update
 */
const resolveAlert = async (
  alertId,
  userId
) => {
  try {
    if (!alertId) {
      throw new Error(
        "Alert ID required"
      );
    }

    if (!userId) {
      throw new Error(
        "User ID required"
      );
    }

    const alert =
      await Alert.findOneAndUpdate(
        {
          _id: alertId,

          user: userId,
        },

        {
          resolved: true,

          status: "resolved",
        },

        {
          new: true,
        }
      );

    return alert;
  } catch (error) {
    logger.error(
      `❌ resolveAlert error: ${error.message}`
    );

    throw error;
  }
};

/**
 * ================= EXPORTS =================
 */
export {
  createAlert,
  getAlerts,
  resolveAlert,
};