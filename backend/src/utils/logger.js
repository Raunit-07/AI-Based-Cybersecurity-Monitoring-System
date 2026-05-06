import winston from "winston";

const isProduction =
  process.env.NODE_ENV === "production";

/**
 * =========================
 * LOGGER FORMAT
 * =========================
 */
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * =========================
 * TRANSPORTS
 * =========================
 * Render/Vercel production environments
 * should use console logging only.
 */
const transports = [
  new winston.transports.Console({
    format: isProduction
      ? logFormat
      : winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
  }),
];

/**
 * =========================
 * LOGGER INSTANCE
 * =========================
 */
const logger = winston.createLogger({
  level:
    process.env.LOG_LEVEL ||
    (isProduction ? "info" : "debug"),

  defaultMeta: {
    service: "threatops-backend",
  },

  transports,

  exitOnError: false,
});

export default logger;