import Alert from "../models/alert.model.js";
import User from "../models/User.js";

import { sendSlackAlert } from "../integrations/slack.js";
import { sendEmailAlert } from "../integrations/email.js";

import validator from "validator";

// ================= UTILS =================
const normalizeAttackType = (
  type
) => {
  if (!type)
    return "Suspicious";

  const t = String(type)
    .toLowerCase()
    .trim();

  if (t.includes("ddos"))
    return "DDoS";

  if (
    t.includes("brute") ||
    t.includes("force")
  )
    return "Brute Force";

  if (
    t.includes("scan") ||
    t.includes("port")
  )
    return "Port Scan";

  if (
    t.includes("sql") ||
    t.includes("inject")
  )
    return "SQL Injection";

  if (t.includes("xss"))
    return "XSS";

  if (t.includes("malware"))
    return "Malware";

  if (
    t.includes("suspicious")
  )
    return "Suspicious";

  if (t.includes("normal"))
    return "Normal";

  return "Suspicious";
};

// ================= CREATE ALERT =================
const createAlert = async (
  alertData = {},
  io = null,
  userId = null
) => {
  try {
    // 🔒 VALIDATION
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

    // 🔒 SANITIZE INPUT
    const ip = String(
      alertData.ip
    ).trim();

    const anomalyScore = Number(
      alertData.anomalyScore ??
      0
    );

    const attackType =
      normalizeAttackType(
        alertData.attackType
      );

    // normalize type
    const normalizedType =
      attackType
        .toLowerCase()
        .replace(/\s+/g, "") ||
      "unknown";

    // 🔥 AUTO SEVERITY
    const severity =
      alertData.severity ||
      (anomalyScore < -0.8
        ? "critical"
        : anomalyScore < -0.6
          ? "high"
          : anomalyScore < -0.4
            ? "medium"
            : "low");

    // ================= CREATE ALERT =================
    const alert =
      await Alert.create({
        // ✅ USER OWNER
        user: userId,

        ip,

        anomalyScore,

        attackType,

        // backward compatibility
        type:
          alertData.type ||
          normalizedType,

        severity,

        meta: {
          requests:
            alertData.requests ||
            0,

          failedLogins:
            alertData.failedLogins ||
            0,
        },

        timestamp:
          alertData.timestamp ||
          new Date(),
      });

    // ================= SOCKET EMIT =================
    if (
      io &&
      alert.user
    ) {
      // ================= SAFE ROOM ID =================
      const roomId =
        alert.user.toString();

      // ================= ALERT PAYLOAD =================
      const alertPayload = {
        id: alert._id,

        user: alert.user,

        ip: alert.ip,

        attackType:
          alert.attackType,

        anomalyScore:
          alert.anomalyScore,

        severity:
          alert.severity,

        timestamp:
          alert.timestamp,

        meta: alert.meta,
      };

      // ================= TRAFFIC PAYLOAD =================
      const trafficPayload = {
        time:
          new Date().toISOString(),

        requests: Number(
          alert.meta?.requests || 0
        ),

        blocked:
          ["high", "critical"].includes(
            alert.severity
          )
            ? 1
            : 0,
      };

      // ================= PRIVATE ALERT EVENT =================
      io.to(roomId).emit(
        "new_alert",
        alertPayload
      );

      // ================= PRIVATE TRAFFIC EVENT =================
      io.to(roomId).emit(
        "traffic_update",
        trafficPayload
      );
    }

    // ================= ALERT INTEGRATIONS =================
    if (
      ["high", "critical"].includes(
        alert.severity
      )
    ) {
      try {
        // ✅ FIND ALERT OWNER
        let user = null;

        if (alert.user) {
          user =
            await User.findById(
              alert.user
            ).lean();
        }

        await Promise.allSettled([
          // Slack
          sendSlackAlert(alert),

          // Email to alert owner
          sendEmailAlert({
            ...alert.toObject(),

            recipientEmail:
              user?.email || null,
          }),
        ]);
      } catch (integrationError) {
        console.error(
          "❌ Alert integration error:",
          integrationError.message
        );
      }
    }

    return alert;
  } catch (error) {
    console.error(
      "❌ createAlert error:",
      error.message
    );

    throw error;
  }
};

// ================= GET ALERTS =================
const getAlerts = async (
  query = {},
  options = {}
) => {
  try {
    const limit = Math.min(
      Number(options.limit) ||
      50,
      100
    );

    const skip = Math.max(
      Number(options.skip) || 0,
      0
    );

    const alerts =
      await Alert.find(query)
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean();

    const total =
      await Alert.countDocuments(
        query
      );

    return {
      success: true,

      data: alerts,

      total,
    };
  } catch (error) {
    console.error(
      "❌ getAlerts error:",
      error.message
    );

    throw error;
  }
};

// ================= RESOLVE ALERT =================
const resolveAlert = async (
  alertId
) => {
  try {
    if (!alertId) {
      throw new Error(
        "Alert ID required"
      );
    }

    const alert =
      await Alert.findByIdAndUpdate(
        alertId,
        {
          resolved: true,
        },
        {
          new: true,
        }
      );

    return alert;
  } catch (error) {
    console.error(
      "❌ resolveAlert error:",
      error.message
    );

    throw error;
  }
};

// ================= EXPORTS =================
export {
  createAlert,
  getAlerts,
  resolveAlert,
};