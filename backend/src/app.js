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
 * ==================================================
 * BASIC SETTINGS
 * ==================================================
 */
app.set("trust proxy", true);

/**
 * ==================================================
 * SECURITY HEADERS
 * ==================================================
 */
app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },

    contentSecurityPolicy: false,
  })
);

/**
 * ==================================================
 * CORS
 * ==================================================
 */
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  process.env.FRONTEND_URL,
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow server-to-server / Postman
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.error(
      `❌ Blocked by CORS: ${origin}`
    );

    return callback(
      new Error("CORS policy violation"),
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

app.use(cors(corsOptions));

/**
 * Express v5 preflight fix
 */
app.options(/.*/, cors(corsOptions));

/**
 * ==================================================
 * BODY PARSER
 * ==================================================
 */
app.use(
  express.json({
    limit: "20kb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "20kb",
  })
);

app.use(cookieParser());

/**
 * ==================================================
 * SAFE SANITIZER
 * ==================================================
 */
const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const cleaned = {};

  for (const [key, value] of Object.entries(obj)) {
    const safeKey = key
      .replace(/\$/g, "")
      .replace(/\./g, "");

    cleaned[safeKey] =
      value &&
        typeof value === "object"
        ? sanitizeObject(value)
        : value;
  }

  return cleaned;
};

app.use((req, res, next) => {
  try {
    if (req.body) {
      req.body =
        sanitizeObject(req.body);
    }

    if (req.params) {
      req.params =
        sanitizeObject(req.params);
    }

    if (req.query) {
      req.query =
        sanitizeObject(req.query);
    }

    next();
  } catch (error) {
    next(error);
  }
});

/**
 * ==================================================
 * COMPRESSION
 * ==================================================
 */
app.use(compression());

/**
 * ==================================================
 * RATE LIMITING
 * ==================================================
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  max: 250,

  standardHeaders: true,

  legacyHeaders: false,

  message: {
    success: false,
    message:
      "Too many requests. Please try again later.",
  },
});

app.use("/api", apiLimiter);

/**
 * ==================================================
 * SOCKET.IO ATTACHMENT
 * ==================================================
 */
app.use(attachIO);

/**
 * ==================================================
 * HEALTH ROUTES
 * ==================================================
 */
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    service: "ThreatOps Backend",
    status: "running",
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    service: "ThreatOps Backend",
    status: "healthy",
    uptime: process.uptime(),
    timestamp:
      new Date().toISOString(),
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    service: "ThreatOps API",
    status: "healthy",
  });
});

/**
 * ==================================================
 * ROUTES
 * ==================================================
 */
app.use("/api/auth", authRoutes);

app.use("/api/logs", logsRoutes);

app.use("/api/alerts", alertRoutes);

app.get(
  "/api/ips",
  authMiddleware,
  alertsController.getSuspiciousIPs
);

/**
 * ==================================================
 * DEBUG ROUTE
 * ==================================================
 */
if (
  process.env.NODE_ENV !==
  "production"
) {
  app.get("/test", (req, res) => {
    res
      .status(200)
      .json({
        success: true,
        message: "TEST OK",
      });
  });
}

/**
 * ==================================================
 * 404 HANDLER
 * ==================================================
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

/**
 * ==================================================
 * GLOBAL ERROR HANDLER
 * ==================================================
 */
app.use(
  (err, req, res, next) => {
    let statusCode =
      err.statusCode ||
      err.status ||
      500;

    let message =
      err.message ||
      "Internal Server Error";

    // Mongoose validation
    if (
      err.name ===
      "ValidationError"
    ) {
      statusCode = 400;

      message = Object.values(
        err.errors
      )
        .map((val) => val.message)
        .join(", ");
    }

    // Mongo duplicate key
    if (err.code === 11000) {
      statusCode = 409;

      message =
        "Duplicate resource detected";
    }

    // JWT errors
    if (
      err.name ===
      "JsonWebTokenError" ||
      err.name ===
      "TokenExpiredError"
    ) {
      statusCode = 401;

      message =
        "Invalid or expired token";
    }

    // CORS errors
    if (
      err.message?.includes(
        "CORS"
      )
    ) {
      statusCode = 403;
    }

    console.error(
      `❌ ${statusCode} - ${message}`
    );

    if (statusCode >= 500) {
      console.error(err.stack);
    }

    return res
      .status(statusCode)
      .json({
        success: false,

        message:
          process.env.NODE_ENV ===
            "production" &&
            statusCode >= 500
            ? "Internal Server Error"
            : message,
      });
  }
);

export default app;