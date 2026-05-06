import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import compression from "compression";

import authRoutes from "./routes/auth.routes.js";
import logsRoutes from "./routes/logs.routes.js";
import alertRoutes from "./routes/alerts.routes.js";
import alertsController from "./controllers/alerts.controller.js";

import { authMiddleware } from "./middlewares/auth.middleware.js";
import { attachIO } from "./middlewares/socket.js";

const app = express();

/**
 * ================= BASIC SETTINGS =================
 */
app.set("trust proxy", 1);

/**
 * ================= SECURITY =================
 */
app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);

/**
 * ================= CORS =================
 */
/**
 * ================= CORS =================
 */
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",

  // ✅ PRODUCTION FRONTEND
  process.env.FRONTEND_URL,
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // ✅ allow mobile apps / postman / server-to-server
    if (!origin) {
      return callback(null, true);
    }

    // ✅ allow configured origins
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.error(`❌ CORS blocked for origin: ${origin}`);

    return callback(
      new Error(`Not allowed by CORS: ${origin}`),
      false
    );
  },

  credentials: true,

  methods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
  ],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
  ],
};

// ✅ APPLY CORS
app.use(cors(corsOptions));

// ✅ EXPRESS V5 PREFLIGHT FIX
app.options(/.*/, cors(corsOptions));

/**
 * ================= BODY PARSING =================
 */
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

/**
 * ================= SAFE CUSTOM SANITIZER =================
 */
const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const cleaned = {};

  for (const [key, value] of Object.entries(obj)) {
    const safeKey = key.replace(/\$/g, "").replace(/\./g, "");

    cleaned[safeKey] =
      value && typeof value === "object" ? sanitizeObject(value) : value;
  }

  return cleaned;
};

app.use((req, res, next) => {
  try {
    if (req.body) {
      req.body = sanitizeObject(req.body);
    }

    if (req.params) {
      req.params = sanitizeObject(req.params);
    }

    if (req.query) {
      Object.defineProperty(req, "query", {
        value: sanitizeObject({ ...req.query }),
        writable: true,
        enumerable: true,
        configurable: true,
      });
    }

    return next();
  } catch (error) {
    return next(error);
  }
});

/**
 * ================= COMPRESSION =================
 */
app.use(compression());

/**
 * ================= GLOBAL RATE LIMIT =================
 */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return res.status(429).json({
      success: false,
      data: null,
      message: "Too many requests, please try again later",
    });
  },
});

app.use("/api", limiter);

/**
 * ================= SOCKET.IO =================
 */
app.use(attachIO);

/**
 * ================= HEALTH =================
 */
app.get("/", (req, res) => {
  res.status(200).send("Backend API Running ✅");
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend API Running ✅",
  });
});

/**
 * ================= ROUTES =================
 */
app.use("/api/auth", authRoutes);
app.use("/api/logs", logsRoutes);
app.use("/api/alerts", alertRoutes);

app.get("/api/ips", authMiddleware, alertsController.getSuspiciousIPs);

/**
 * ================= DEBUG ROUTE =================
 */
if (process.env.NODE_ENV !== "production") {
  app.get("/test", (req, res) => {
    res.status(200).send("TEST OK");
  });
}

/**
 * ================= 404 =================
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    data: null,
    message: "Route not found",
  });
});

/**
 * ================= GLOBAL ERROR HANDLER =================
 */
app.use((err, req, res, next) => {
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || "Internal Server Error";

  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
  }

  if (err.code === 11000) {
    console.error("Duplicate key error details:", err);
    statusCode = 409;
    message = "User already exists with this email";
  }

  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Invalid or expired token";
  }

  if (err.message?.startsWith("Not allowed by CORS")) {
    statusCode = 403;
    message = err.message;
  }

  console.error(`❌ Error [${statusCode}]: ${message}`);

  if (statusCode >= 500) {
    console.error(err.stack);
  }

  return res.status(statusCode).json({
    success: false,
    data: null,
    message:
      process.env.NODE_ENV === "production" && statusCode === 500
        ? "Internal Server Error"
        : message,
  });
});

export default app;