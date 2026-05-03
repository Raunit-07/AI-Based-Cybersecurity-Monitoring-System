import dotenv from "dotenv";
dotenv.config(); // 🔥 MUST BE FIRST

import dns from "dns";
dns.setServers(["1.1.1.1", "8.8.8.8"]);

import connectDB from "./config/db.js";
import http from "http";
import { Server } from "socket.io";
import app from "./app.js";
import logger from "./utils/logger.js";

const PORT = process.env.PORT || 5000;

// ================= CREATE HTTP SERVER =================
const server = http.createServer(app);

// ================= INIT SOCKET.IO =================
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  },
});

// ================= MAKE IO GLOBAL =================
app.set("io", io);

// ================= SOCKET CONNECTION =================
io.on("connection", (socket) => {
  logger.info(`🟢 Client connected: ${socket.id}`);

  socket.on("disconnect", () => {
    logger.info(`🔴 Client disconnected: ${socket.id}`);
  });
});

// ================= HANDLE SERVER ERRORS =================
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    logger.error(`❌ Port ${PORT} is already in use`);
    process.exit(1); 
  } else {
    logger.error("❌ Server error:", err);
    process.exit(1);
  }
});

// ================= START APP =================
const startServer = async () => {
  try {
    await connectDB();

    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
    });

  } catch (error) {
    logger.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

// ================= GRACEFUL SHUTDOWN =================
process.on("SIGINT", () => {
  logger.info("🛑 Server shutting down...");
  server.close(() => {
    logger.info("💤 Server closed");
    process.exit(0);
  });
});

process.on("unhandledRejection", (err) => {
  logger.error("❌ Unhandled Promise Rejection:", err);
  process.exit(1);
});

// ================= EXPORT =================
export { server, io };