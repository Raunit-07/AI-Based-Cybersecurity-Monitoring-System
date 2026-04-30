import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import app from "./app.js";
import logger from "./utils/logger.js";
dotenv.config();

const PORT = process.env.PORT || 5000;

// ================= CREATE HTTP SERVER =================
const server = http.createServer(app);

// ================= INIT SOCKET.IO =================
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

// ================= MAKE IO GLOBAL =================
app.set("io", io);

// ================= SOCKET CONNECTION =================
io.on("connection", (socket) => {
  logger.info(`🟢 Client connected: ${socket.id}`);

  // 🔁 Simulated traffic (for testing)
  const trafficInterval = setInterval(() => {
    socket.emit("traffic_update", {
      time: new Date().toLocaleTimeString(),
      requests: Math.floor(Math.random() * 500) + 100,
      blocked: Math.floor(Math.random() * 50),
    });
  }, 2000);

  socket.on("disconnect", () => {
    logger.info(`🔴 Client disconnected: ${socket.id}`);
    clearInterval(trafficInterval);
  });
});

// ================= START SERVER =================
server.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
});

// ================= EXPORT =================
export { server, io };