import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.routes.js";
import logsRoutes from "./routes/logs.routes.js";
import alertRoutes from "./routes/alerts.routes.js";
import alertsController from "./controllers/alerts.controller.js";

import { authMiddleware } from "./middlewares/auth.middleware.js";
import { attachIO } from "./middlewares/socket.js";

const app = express();

// ================= SECURITY =================
app.use(helmet());

// 🔥 Attach Socket.IO middleware FIRST
app.use(attachIO);

// ================= CORS =================
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// ================= BODY PARSING =================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ================= BASIC SANITIZATION =================
app.use((req, res, next) => {
  if (req.body && typeof req.body === "object") {
    for (let key in req.body) {
      if (key.startsWith("$") || key.includes(".")) {
        delete req.body[key];
      }
    }
  }
  next();
});

// ================= HEALTH =================
app.get("/", (req, res) => {
  res.send("Backend API Running ✅");
});

// ================= ROUTES =================
app.use("/api/auth", authRoutes);
app.use("/api/logs", logsRoutes);
app.use("/api/alerts", alertRoutes);

// 🔥 Protected route
app.get("/api/ips", authMiddleware, alertsController.getSuspiciousIPs);

// ================= DEBUG =================
app.get("/test", (req, res) => {
  res.send("TEST OK");
});

// ================= 404 =================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// ================= GLOBAL ERROR HANDLER =================
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

export default app;