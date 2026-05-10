import logger from "../utils/logger.js";

/**
 * ============================================
 * EMIT LIVE TRAFFIC UPDATE
 * ============================================
 * Sends ALL traffic activity to frontend
 * without creating duplicate alerts.
 */
export const emitTrafficUpdate = (
    io,
    userId,
    data = {}
) => {
    try {
        if (!io || !userId) return;

        const roomId = userId.toString();

        const payload = {
            time: new Date().toISOString(),

            requests:
                Number(data.requests) || 0,

            blocked: data.isAnomaly
                ? 1
                : 0,

            ip: data.ip || "unknown",

            attackType:
                data.attackType || "Normal",
        };

        io.to(roomId).emit(
            "traffic_update",
            payload
        );
    } catch (error) {
        logger.error(
            `❌ emitTrafficUpdate error: ${error.message}`
        );
    }
};