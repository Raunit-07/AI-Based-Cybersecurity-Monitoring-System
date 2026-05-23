import AuditLog from "../models/auditLog.model.js";
import logger from "./logger.js";

/**
 * Log a security audit event
 * @param {Object} params
 * @param {string} params.userId - ID of the user performing the action
 * @param {string} params.ip - IP address of the request
 * @param {string} params.action - Action performed (e.g. auth.login)
 * @param {string} params.status - 'success' or 'failure'
 * @param {Object} params.details - Additional metadata/context
 * @param {string} params.userAgent - User agent string
 */
export const logAuditEvent = async ({
  userId = null,
  ip = "0.0.0.0",
  action,
  status,
  details = {},
  userAgent = "unknown"
}) => {
  try {
    // 1. Save to MongoDB
    await AuditLog.create({
      user: userId,
      ip,
      action,
      status,
      details,
      userAgent
    });

    // 2. Log structured JSON via Winston
    logger.info(`Audit Log: ${action} - ${status}`, {
      type: "audit",
      userId,
      ip,
      action,
      status,
      details,
      userAgent,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    logger.error(`Failed to record audit log: ${err.message}`, {
      error: err.stack
    });
  }
};

export default {
  logAuditEvent
};
