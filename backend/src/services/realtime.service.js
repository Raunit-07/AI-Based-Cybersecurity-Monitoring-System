import logger from "../utils/logger.js";

/**
 * ============================================
 * SAFE ROOM ID
 * ============================================
 */
const getRoomId = (userId) => {
  if (!userId) return null;

  return userId.toString();
};

/**
 * ============================================
 * EMIT TRAFFIC UPDATE
 * ============================================
 */
export const emitTrafficUpdate = (io, userId, data = {}) => {
  try {
    if (!io) {
      logger.warn(
        "⚠️ emitTrafficUpdate skipped: io instance missing"
      );
      return;
    }

    if (!userId) {
      logger.warn(
        "⚠️ emitTrafficUpdate skipped: userId missing"
      );
      return;
    }

    const roomId = getRoomId(userId);

    const payload = {
      time: new Date().toISOString(),

      requests: Math.max(
        0,
        Number(data.requests) || 0
      ),

      blocked

/**
 * ============================================
 * EMIT DEVICE ONLINE
 * ============================================
 */
export const emitDeviceOnline = (io, device, userId) => {
  try {
    if (!io || !device || !userId) {
      return;
    }

    const roomId = getRoomId(userId);

    const payload = {
      deviceId: device.deviceId || null,

      hostname: device.hostname || "unknown",

      status: device.status || "offline",

      os: device.os || "unknown",

      lastSeen: device.lastSeen || new Date(),
    };

    io.to(roomId).emit(
      "device_online",

      payload,
    );
  } catch (error) {
    logger.error(`emitDeviceOnline error: ${error.message}`);
  }
};

/**
 * ============================================
 * EMIT ALERT
 * ============================================
 */
export const emitAlert = (io, userId, alert = {}) => {
  try {
    if (!io || !userId) {
      return;
    }

    const roomId = getRoomId(userId);

    const payload = {
      id: alert.id || alert._id || null,

      ip: alert.ip || "unknown",

      deviceId: alert.deviceId || null,

      attackType: alert.attackType || "Suspicious",

      severity: alert.severity || "medium",

      anomalyScore: Number(alert.anomalyScore) || 0,

      message: alert.message || "Threat detected",

      status: alert.status || "active",

      timestamp: alert.timestamp || new Date(),

      meta: {
        requests: alert?.meta?.requests || 0,

        failedLogins: alert?.meta?.failedLogins || 0,

        blocked: Boolean(alert?.meta?.blocked),
      },
    };

    io.to(roomId).emit(
      "new_alert",

      payload,
    );
  } catch (error) {
    logger.error(`emitAlert error: ${error.message}`);
  }
};
