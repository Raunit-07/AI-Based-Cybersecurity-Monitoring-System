import mongoose from "mongoose";

import validator from "validator";

/**
 * ================= ALERT SCHEMA =================
 * Enterprise-grade multi-user alert model
 */
const alertSchema = new mongoose.Schema(
  {
    /**
     * ================= ALERT OWNER =================
     * CRITICAL FOR TENANT ISOLATION
     */
    user: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      required: [
        true,
        "Alert owner is required",
      ],

      immutable: true,

      index: true,
    },

    /**
     * ================= SOURCE IP =================
     */
    ip: {
      type: String,

      required: [
        true,
        "IP address is required",
      ],

      trim: true,

      index: true,

      validate: {
        validator(value) {
          return (
            typeof value === "string" &&
            validator.isIP(
              value.trim()
            )
          );
        },

        message:
          "Invalid IP address format",
      },
    },

    /**
     * ================= ML SCORE =================
     */
    anomalyScore: {
      type: Number,

      required: true,

      min: -1,

      max: 1,

      default: 0,
    },

    /**
     * ================= ATTACK TYPE =================
     */
    attackType: {
      type: String,

      enum: [
        "DDoS",
        "Brute Force",
        "Port Scan",
        "SQL Injection",
        "XSS",
        "Malware",
        "Suspicious",
        "Normal",
      ],

      default: "Suspicious",

      trim: true,

      index: true,
    },

    /**
     * ================= INTERNAL TYPE =================
     */
    type: {
      type: String,

      enum: [
        "ddos",
        "bruteforce",
        "scan",
        "sqli",
        "xss",
        "malware",
        "suspicious",
        "normal",
        "unknown",
      ],

      default: "unknown",

      lowercase: true,

      trim: true,

      index: true,
    },

    /**
     * ================= SEVERITY =================
     */
    severity: {
      type: String,

      enum: [
        "low",
        "medium",
        "high",
        "critical",
      ],

      default: "medium",

      required: true,

      lowercase: true,

      trim: true,

      index: true,
    },

    /**
     * ================= HUMAN MESSAGE =================
     */
    message: {
      type: String,

      trim: true,

      maxlength: 500,

      default: "Threat detected",
    },

    /**
     * ================= RAW LOG =================
     */
    rawLog: {
      type: String,

      trim: true,

      maxlength: 5000,

      default: "",
    },

    /**
     * ================= STATUS =================
     */
    status: {
      type: String,

      enum: [
        "active",
        "investigating",
        "resolved",
      ],

      default: "active",

      lowercase: true,

      trim: true,

      index: true,
    },

    /**
     * ================= RESOLVED =================
     */
    resolved: {
      type: Boolean,

      default: false,

      index: true,
    },

    /**
     * ================= ALERT SOURCE =================
     */
    source: {
      type: String,

      default: "nginx",

      trim: true,

      maxlength: 100,
    },

    /**
     * ================= GEOLOCATION =================
     */
    geo: {
      country: {
        type: String,

        default: "",

        trim: true,
      },

      city: {
        type: String,

        default: "",

        trim: true,
      },
    },

    /**
     * ================= EXTRA METADATA =================
     */
    meta: {
      requests: {
        type: Number,

        min: 0,

        default: 0,
      },

      failedLogins: {
        type: Number,

        min: 0,

        default: 0,
      },

      blocked: {
        type: Boolean,

        default: false,
      },
    },

    /**
     * ================= EVENT TIME =================
     */
    timestamp: {
      type: Date,

      default: Date.now,

      index: true,
    },
  },

  {
    timestamps: true,

    versionKey: false,

    strict: true,
  }
);

/**
 * ================= PERFORMANCE INDEXES =================
 */

// Timeline
alertSchema.index({
  user: 1,
  createdAt: -1,
});

// IP analytics
alertSchema.index({
  user: 1,
  ip: 1,
  createdAt: -1,
});

// Severity analytics
alertSchema.index({
  user: 1,
  severity: 1,
  createdAt: -1,
});

// Attack analytics
alertSchema.index({
  user: 1,
  attackType: 1,
  createdAt: -1,
});

// Status filtering
alertSchema.index({
  user: 1,
  status: 1,
  resolved: 1,
});

// Fast anomaly dashboards
alertSchema.index({
  user: 1,
  resolved: 1,
  severity: 1,
  timestamp: -1,
});

/**
 * ================= SAFE JSON OUTPUT =================
 */
alertSchema.methods.toJSON =
  function () {
    const obj =
      this.toObject();

    delete obj.__v;

    return obj;
  };

/**
 * ================= SAFE MODEL EXPORT =================
 */
const Alert =
  mongoose.models.Alert ||
  mongoose.model(
    "Alert",
    alertSchema
  );

export default Alert;