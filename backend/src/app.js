import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import compression from "compression";

import authRoutes from "./routes/auth.routes.js";
import logsRoutes from "./routes/logs.routes.js";
import alertRoutes from "./routes/alerts.routes.js";
import devicesRoutes from "./routes/device.routes.js";
import alertsController from "./controllers/alerts.controller.js";

import { authMiddleware } from "./middlewares/auth.middleware.js";
import { attachIO } from "./middlewares/socket.js";
import { enforceHttps } from "./middlewares/httpsEnforcer.js";
import { csrfProtection } from "./middlewares/csrf.js";
import { logAuditEvent } from "./utils/auditLogger.js";

const app = express();

/**
 * ================= BASIC SETTINGS =================
 */
app.set("trust proxy", 1);

/**
 * ================= SECURITY =================
 */
app.use(enforceHttps);

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'", "wss:", "ws:", "http://localhost:*", "https://*"]
      }
    },
    xFrameOptions: { action: "deny" },
    referrerPolicy: { policy: "same-origin" }
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


app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "healthy",
    service: "threatops-backend",
    timestamp: new Date().toISOString(),
  });
});

// ✅ APPLY CORS
app.use(cors(corsOptions));
// added
// ✅ EXPRESS V5 PREFLIGHT FIX
app.options(/.*/, cors(corsOptions));

/**
 * ================= BODY PARSING =================
 */
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());
app.use(csrfProtection);

const auditLogMiddleware = (req, res, next) => {
  const criticalRoutes = [
    { path: "/api/auth/login", action: "auth.login" },
    { path: "/api/auth/register", action: "auth.register" },
    { path: "/api/auth/regenerate-api-key", action: "api_key.regenerate" },
    { path: "/api/devices/register", action: "device.register" }
  ];

  const matched = criticalRoutes.find(r => req.originalUrl?.startsWith(r.path));
  if (!matched) {
    return next();
  }

  const originalEnd = res.end;
  res.end = function (chunk, encoding) {
    res.end = originalEnd;
    res.end(chunk, encoding);

    const status = res.statusCode >= 200 && res.statusCode < 300 ? "success" : "failure";
    const userId = req.user?._id || req.user?.id || null;
    const ip = req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress || "0.0.0.0";
    const userAgent = req.headers["user-agent"] || "unknown";

    logAuditEvent({
      userId,
      ip,
      action: matched.action,
      status,
      details: {
        method: req.method,
        statusCode: res.statusCode,
        endpoint: req.originalUrl
      },
      userAgent
    }).catch(err => console.error("Audit logging error:", err));
  };

  next();
};

app.use(auditLogMiddleware);

/**
 * ==================================================
 * SAFE CUSTOM SANITIZER (NoSQL injection + HTML XSS Clean)
 * ==================================================
 */
const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const cleaned = {};

  for (const [key, value] of Object.entries(obj)) {
    // Prevent NoSQL query injection by removing $ and .
    const safeKey = key.replace(/\$/g, "").replace(/\./g, "");

    let safeValue = value;
    if (value && typeof value === "object") {
      safeValue = sanitizeObject(value);
    } else if (typeof value === "string") {
      // Prevent XSS by stripping HTML tags (skipping keys and passwords)
      const skipXss = ["password", "confirmPassword", "accessToken", "refreshToken", "apiKey", "deviceKey"];
      if (!skipXss.includes(safeKey)) {
        safeValue = value.replace(/<[^>]*>/g, "");
      }
    }

    cleaned[safeKey] = safeValue;
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

app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] DEBUG: Global Request - ${req.method} ${req.originalUrl}`);
  console.log(`[${timestamp}] DEBUG: Headers - x-api-key: ${req.headers["x-api-key"] ? "PRESENT" : "MISSING"}`);
  next();
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
app.use(
  "/api/devices",
  devicesRoutes
);

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