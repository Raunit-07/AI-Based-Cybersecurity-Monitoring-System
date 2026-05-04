import dotenv from "dotenv";
dotenv.config(); // MUST be first

import dns from "dns";
dns.setServers(["1.1.1.1", "8.8.8.8"]);

import http from "http";
import app from "./app.js";
import connectDB from "./config/db.js";
import logger from "./utils/logger.js";
import { Server } from "socket.io";

// Email verification
import { verifyEmailService } from "./integrations/email.js";

const PORT = process.env.PORT || 5000;

/**
 * ================= SERVER SETUP =================
 */
const server = http.createServer(app);

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

/**
 * ================= SOCKET.IO CONFIG =================
 */
const io = new Server(server, {
  cors: {
    origin: [FRONTEND_URL],
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"], // fallback support
  allowEIO3: true, // legacy browser support
  pingTimeout: 60000,
  pingInterval: 25000,
});

/**
 * ================= SOCKET AUTH MIDDLEWARE =================
 * (Optional but recommended for protected sockets)
 */
io.use((socket, next) => {
  try {
    // Example: read token from cookies or auth header
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(" ")[1];

    // If you want strict auth, enable this:
    // if (!token) return next(new Error("Unauthorized socket"));

    next();
  } catch (err) {
    logger.error("Socket auth error:", err);
    next(new Error("Socket authentication failed"));
  }
});

/**
 * ================= SOCKET EVENTS =================
 */
io.on("connection", (socket) => {
  logger.info(`✅ Socket connected: ${socket.id}`);

  // Example event
  socket.on("ping", () => {
    socket.emit("pong");
  });

  socket.on("disconnect", (reason) => {
    logger.info(`❌ Socket disconnected: ${socket.id} | ${reason}`);
  });

  socket.on("error", (err) => {
    logger.error(`❌ Socket error (${socket.id}): ${err.message}`);
  });
});

/**
 * ================= MAKE IO AVAILABLE =================
 */
app.set("io", io);

/**
 * ================= SERVER INSTANCE =================
 */
let serverInstance = null;

/**
 * ================= START SERVER =================
 */
const startServer = async () => {
  try {
    await connectDB();

    await verifyEmailService();

    if (serverInstance) {
      logger.warn("⚠️ Restarting server...");
      await new Promise((resolve) => serverInstance.close(resolve));
    }

    serverInstance = server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`🌐 Frontend allowed: ${FRONTEND_URL}`);
      logger.info(`🔌 Socket.IO ready`);
    });

    serverInstance.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        logger.error(`❌ Port ${PORT} already in use`);
      } else {
        logger.error("❌ Server error:", err);
      }
      process.exit(1);
    });

  } catch (error) {
    logger.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

/**
 * ================= GRACEFUL SHUTDOWN =================
 */
const shutdown = () => {
  logger.info("🛑 Graceful shutdown initiated");

  if (serverInstance) {
    serverInstance.close(() => {
      logger.info("💤 Server closed");
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

/**
 * ================= GLOBAL ERROR HANDLING =================
 */
process.on("unhandledRejection", (err) => {
  logger.error("❌ Unhandled Rejection:", err);
  shutdown();
});

process.on("uncaughtException", (err) => {
  logger.error("❌ Uncaught Exception:", err);
  shutdown();
});

/**
 * ================= EXPORT =================
 */
export { serverInstance as server, io };
