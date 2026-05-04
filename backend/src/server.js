import dotenv from "dotenv";
dotenv.config(); // MUST BE FIRST

import dns from "dns";
dns.setServers(["1.1.1.1", "8.8.8.8"]);

import http from "http";
import app from "./app.js";
import connectDB from "./config/db.js";
import logger from "./utils/logger.js";

// ✅ CORRECT IMPORT
import initSocket from "./sockets/index.js";

const PORT = process.env.PORT || 5000;

// ================= CREATE SERVER =================
const server = http.createServer(app);

// ================= INIT SOCKET =================
const io = initSocket(server);

// ================= MAKE IO AVAILABLE =========
app.set("io", io);

app.use((req, res, next) => {
  req.io = io;
  next();
});

// ================= ERROR HANDLING =================
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    logger.error(`❌ Port ${PORT} is already in use`);
  } else {
    logger.error("❌ Server error:", err);
  }
  process.exit(1);
});

// ================= START =================
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

// ================= SHUTDOWN =================
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

export { server, io };