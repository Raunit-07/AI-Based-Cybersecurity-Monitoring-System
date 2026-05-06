import { Server } from "socket.io";
import logger from "../utils/logger.js";

let io = null;

// ================= INIT =================
const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL
        ? [process.env.FRONTEND_URL]
        : ["http://localhost:5173", "http://127.0.0.1:5173"],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    logger.info(`⚡ Client connected: ${socket.id}`);

    // Optional room
    socket.join("global");

    socket.on("ping", () => {
      socket.emit("pong", { time: Date.now() });
    });

    socket.on("disconnect", () => {
      logger.info(`❌ Client disconnected: ${socket.id}`);
    });
  });

  logger.info("✅ Socket.IO initialized");

  return io;
};

// ================= EMIT LOG =================
const emitLog = (log) => {
  if (!io) return;

  try {
    io.emit("new_log", {
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
    logger.error("❌ emitLog error:", error.message);
  }
};

// ================= EMIT ALERT =================
const emitAlert = (alert) => {
  if (!io) {
    logger.error("❌ Socket.IO not initialized");
    return;
  }

  try {
    const formattedAlert = {
      id: alert._id || null,
      ip: alert.ip || "unknown",
      type: alert.type || alert.attackType || "unknown",
      severity: alert.severity || "low",
      requests: alert.requests || 0,
      failedLogins: alert.failedLogins || 0,
      score: alert.anomaly_score || 0,
      time: alert.timestamp
        ? new Date(alert.timestamp).toISOString()
        : new Date().toISOString(),
      status: alert.status || "active",
    };

    io.emit("new-alert", formattedAlert);

    logger.info("📡 Alert emitted to clients");
  } catch (error) {
    logger.error("❌ emitAlert error:", error.message);
  }
};

// ================= EMIT TRAFFIC =================
const emitTraffic = (data) => {
  if (!io) return;

  try {
    io.emit("traffic_update", {
      timestamp: Date.now(),
      requests: data.requests || 0,
    });
  } catch (error) {
    logger.error("❌ emitTraffic error:", error.message);
  }
};

// ================= EXPORT =================
export { initSocket, emitAlert, emitLog, emitTraffic };
export default initSocket;