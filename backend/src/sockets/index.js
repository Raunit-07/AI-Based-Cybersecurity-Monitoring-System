import { Server } from "socket.io";
import jwt from "jsonwebtoken";

import logger from "../utils/logger.js";

let io = null;

/**
 * ================= INIT SOCKET =================
 */
const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL
        ? [process.env.FRONTEND_URL]
        : ["http://localhost:5173", "http://127.0.0.1:5173"],

      methods: ["GET", "POST"],

      credentials: true,
    },

    transports: ["websocket", "polling"],
  });

  /**
   * ================= SOCKET AUTH =================
   */
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Unauthorized"));
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_ACCESS_SECRET
      );

      if (!decoded?.id) {
        return next(new Error("Invalid token"));
      }

      socket.userId = decoded.id;
      socket.userRole = decoded.role;

      next();
    } catch (error) {
      logger.error(
        `❌ Socket auth error: ${error.message}`
      );

      next(new Error("Socket authentication failed"));
    }
  });

  /**
   * ================= CONNECTION =================
   */
  io.on("connection", (socket) => {
    logger.info(
      `⚡ Client connected: ${socket.id} | User: ${socket.userId}`
    );

    /**
     * ================= USER ROOM =================
     */
    socket.join(socket.userId);

    logger.info(
      `✅ User joined private room: ${socket.userId}`
    );

    /**
     * ================= PING/PONG =================
     */
    socket.on("ping", () => {
      socket.emit("pong", {
        time: Date.now(),
      });
    });

    /**
     * ================= DISCONNECT =================
     */
    socket.on("disconnect", (reason) => {
      logger.info(
        `❌ Client disconnected: ${socket.id} | ${reason}`
      );
    });

    /**
     * ================= SOCKET ERROR =================
     */
    socket.on("error", (err) => {
      logger.error(
        `❌ Socket error (${socket.id}): ${err.message}`
      );
    });
  });

  logger.info("✅ Secure Socket.IO initialized");

  return io;
};

/**
 * ================= EMIT LOG =================
 * Multi-user safe
 */
const emitLog = (userId, log) => {
  if (!io || !userId || !log) return;

  try {
    io.to(userId).emit("new_log", {
      id: log._id,
      ip: log.ip,
      requests: log.requests,
      failedLogins: log.failedLogins,
      attackType: log.attackType,
      is_anomaly: log.is_anomaly,
      anomaly_score: log.anomaly_score,
      timestamp: log.timestamp,
    });
  } catch (error) {
    logger.error(
      `❌ emitLog error: ${error.message}`
    );
  }
};

/**
 * ================= EMIT ALERT =================
 * Multi-user safe
 */
const emitAlert = (userId, alert) => {
  if (!io || !userId || !alert) {
    logger.error("❌ Invalid emitAlert payload");
    return;
  }

  try {
    const formattedAlert = {
      id: alert._id || null,

      ip: alert.ip || "unknown",

      attackType:
        alert.attackType ||
        alert.type ||
        "unknown",

      severity: alert.severity || "low",

      requests:
        alert.requests ||
        alert.meta?.requests ||
        0,

      failedLogins:
        alert.failedLogins ||
        alert.meta?.failedLogins ||
        0,

      anomalyScore:
        alert.anomalyScore ||
        alert.score ||
        0,

      timestamp: alert.timestamp
        ? new Date(alert.timestamp).toISOString()
        : new Date().toISOString(),

      status: alert.status || "active",
    };

    // ✅ USER-SCOPED EMIT
    io.to(userId).emit(
      "new_alert",
      formattedAlert
    );

    logger.info(
      `📡 Alert emitted to user room: ${userId}`
    );
  } catch (error) {
    logger.error(
      `❌ emitAlert error: ${error.message}`
    );
  }
};

/**
 * ================= EMIT TRAFFIC =================
 * Multi-user safe
 */
const emitTraffic = (userId, data) => {
  if (!io || !userId || !data) return;

  try {
    io.to(userId).emit("traffic_update", {
      timestamp: Date.now(),

      requests: data.requests || 0,
    });
  } catch (error) {
    logger.error(
      `❌ emitTraffic error: ${error.message}`
    );
  }
};

/**
 * ================= EXPORT =================
 */
export {
  initSocket,
  emitAlert,
  emitLog,
  emitTraffic,
};

export default initSocket;