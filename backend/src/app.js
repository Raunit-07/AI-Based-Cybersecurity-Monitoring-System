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

app.use(attachIO);

app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174"],
  credentials: true
}));

// ================= BODY =================
app.use(express.json());
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

// ================= ROUTES =================
app.get("/", (req, res) => {
  res.send("Backend API Running ✅");
});

app.use("/api/auth", authRoutes);
app.use("/api/logs", logsRoutes);
app.use("/api/alerts", alertRoutes);
app.get("/api/ips", authMiddleware, alertsController.getSuspiciousIPs);

// ================= DEBUG ROUTE =================
app.get("/test", (req, res) => {
  res.send("TEST OK");
});

// ================= 404 =================
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ================= ERROR =================
app.use((err, req, res, next) => {
  console.error("Error:", err.message);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

export default app;