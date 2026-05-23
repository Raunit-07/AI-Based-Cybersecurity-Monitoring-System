import logger from "../utils/logger.js";

const normalizeLogs = (req, res, next) => {
  try {
    const logs = Array.isArray(req.body.logs) ? req.body.logs : [req.body];

    const normalizedLogs = logs.map((log) => ({
      ip: String(log.ip || ""),

      endpoint: String(log.endpoint || "/"),

      method: String(log.method || "GET"),

      requests: Number(log.requests) || 1,

      statusCode: Number(log.statusCode) || 200,

      bytes: Number(log.bytes) || 0,

      failedLogins: Number(log.failedLogins) || 0,

      timestamp: log.timestamp ? new Date(log.timestamp) : new Date(),

      user_agent: String(log.user_agent || "Unknown"),

      referrer: String(log.referrer || "-"),

      /*
      Device context
      */

      deviceId: req.device?.deviceId || null,

      userId: req.device?.userId || null,

      organizationId: req.device?.organizationId || null,
    }));

    req.logs = normalizedLogs;

    next();
  } catch (err) {
    logger.error("Log normalization failed", {
      error: err.message,
      stack: err.stack,
    });

    return res.status(500).json({
      success: false,
      data: null,
      message: "Log normalization failed",
    });
  }
};

export default normalizeLogs;
