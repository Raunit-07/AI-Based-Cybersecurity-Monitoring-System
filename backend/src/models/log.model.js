import mongoose from "mongoose";

/**
 * ================= LOG SCHEMA =================
 * Multi-user SaaS safe
 */
const logSchema = new mongoose.Schema(
  {
    /**
     * ================= TENANT OWNERSHIP =================
     * CRITICAL FOR MULTI-USER ISOLATION
     */
    user: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      required: true,

      index: true,
    },

    /**
     * ================= BASIC INFO =================
     */
    ip: {
      type: String,

      required: true,

      index: true,

      trim: true,
    },

    requests: {
      type: Number,

      required: true,

      min: 0,

      max: 100000,
    },

    failedLogins: {
      type: Number,

      default: 0,

      min: 0,

      max: 10000,
    },

    endpoint: {
      type: String,

      required: true,

      trim: true,

      maxlength: 300,
    },

    method: {
      type: String,

      required: true,

      enum: [
        "GET",
        "POST",
        "PUT",
        "DELETE",
        "PATCH",
        "OPTIONS",
      ],
    },

    user_agent: {
      type: String,

      default: "unknown",

      maxlength: 500,
    },

    timestamp: {
      type: Date,

      default: Date.now,

      index: true,
    },

    /**
     * ================= ML OUTPUT =================
     */
    is_anomaly: {
      type: Boolean,

      default: false,

      index: true,
    },

    anomaly_score: {
      type: Number,

      default: 0,
    },

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

      default: "Normal",

      index: true,
    },
  },

  {
    timestamps: true,

    strict: true,
  }
);

/**
 * ================= PERFORMANCE INDEXES =================
 */

// User-specific analytics
logSchema.index({
  user: 1,
  timestamp: -1,
});

// User + IP queries
logSchema.index({
  user: 1,
  ip: 1,
  timestamp: -1,
});

// Attack analytics
logSchema.index({
  user: 1,
  attackType: 1,
  timestamp: -1,
});

// Fast anomaly queries
logSchema.index({
  user: 1,
  is_anomaly: 1,
  timestamp: -1,
});

/**
 * ================= SAFE MODEL EXPORT =================
 */
const Log =
  mongoose.models.Log ||
  mongoose.model("Log", logSchema);

export default Log;