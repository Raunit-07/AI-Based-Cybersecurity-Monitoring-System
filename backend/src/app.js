import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import compression from "compression";
import hpp from "hpp";

import authRoutes from "./routes/auth.routes.js";
import logsRoutes from "./routes/logs.routes.js";
import alertRoutes from "./routes/alerts.routes.js";
import alertsController from "./controllers/alerts.controller.js";

import { authMiddleware } from "./middlewares/auth.middleware.js";
import { attachIO } from "./middlewares/socket.js";

const app = express();

// ================= BASIC SETTINGS =================
app.set("trust proxy", 1);

// ================= SECURITY =================
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Prevent NoSQL injection
app.use(mongoSanitize());

// Prevent HTTP parameter pollution
app.use(hpp());

// ================= CORS (FIXED PROPERLY) =================
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (mobile apps, Postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// 🔥 Handle preflight requests (VERY IMPORTANT)
app.options(/.*/, cors());

// ================= BODY PARSING =================
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// ================= PERFORMANCE =================
app.use(compression());

// ================= RATE LIMIT =================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later",
  },
});

app.use("/api", limiter);

// ================= SOCKET.IO =================
app.use(attachIO);

// ================= HEALTH =================
app.get("/", (req, res) => {
  res.send("Backend API Running ✅");
});

// ================= ROUTES =================
app.use("/api/auth", authRoutes);
app.use("/api/logs", logsRoutes);
app.use("/api/alerts", alertRoutes);

// Protected route
app.get("/api/ips", authMiddleware, alertsController.getSuspiciousIPs);

// ================= DEBUG =================
if (process.env.NODE_ENV !== "production") {
  app.get("/test", (req, res) => {
    res.send("TEST OK");
  });
}

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
    message:
      process.env.NODE_ENV === "production"
        ? "Internal Server Error"
        : err.message,
  });
});

export default app;