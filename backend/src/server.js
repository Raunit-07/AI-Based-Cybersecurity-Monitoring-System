import dotenv from "dotenv";
dotenv.config(); // MUST BE FIRST

import dns from "dns";
dns.setServers(["1.1.1.1", "8.8.8.8"]);

import http from "http";
import app from "./app.js";
import connectDB from "./config/db.js";
import logger from "./utils/logger.js";
import { Server } from "socket.io";

// ✅ EMAIL VERIFY IMPORT
import { verifyEmailService } from "./integrations/email.js";

const PORT = process.env.PORT || 5000;

// ================= CREATE SERVER =================
const server = http.createServer(app);

// ================= CORS CONFIG =================
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// ================= SOCKET.IO INIT (PRODUCTION SAFE) =================
const io = new Server(server, {
  cors: {
    origin: [FRONTEND_URL],
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"], // ✅ allow fallback
  pingTimeout: 60000, // ✅ prevent disconnects
  pingInterval: 25000,
});

// ================= SOCKET EVENTS =================
io.on("connection", (socket) => {
  logger.info(`✅ Socket connected: ${socket.id}`);

  socket.on("disconnect", (reason) => {
    logger.info(`❌ Socket disconnected: ${socket.id} | Reason: ${reason}`);
  });

  socket.on("error", (err) => {
    logger.error(`❌ Socket error (${socket.id}): ${err.message}`);
  });
});

// ================= MAKE IO AVAILABLE (GLOBAL) =================
app.set("io", io);

// ❌ REMOVE THIS (IMPORTANT)
// app.use((req, res, next) => {
//   req.io = io;
//   next();
// });

// ================= GLOBAL SERVER INSTANCE =================
let serverInstance = null;

// ================= START SERVER =================
const startServer = async () => {
  try {
    await connectDB();

    // ✅ VERIFY EMAIL SERVICE
    await verifyEmailService();

    // 🔁 Restart-safe
    if (serverInstance) {
      logger.warn("⚠️ Closing previous server instance...");
      await new Promise((resolve) => serverInstance.close(resolve));
    }

    serverInstance = server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`🔌 Socket.IO ready at ws://localhost:${PORT}`);
      logger.info(`🌐 Allowed frontend: ${FRONTEND_URL}`);
    });

    // ================= ERROR HANDLING =================
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

// ================= GRACEFUL SHUTDOWN =================
const shutdown = () => {
  logger.info("🛑 Shutting down server...");

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

// ================= GLOBAL ERROR HANDLING =================
process.on("unhandledRejection", (err) => {
  logger.error("❌ Unhandled Promise Rejection:", err);
  shutdown();
});

process.on("uncaughtException", (err) => {
  logger.error("❌ Uncaught Exception:", err);
  shutdown();
});

// ================= EXPORT =================
export { serverInstance as server, io };