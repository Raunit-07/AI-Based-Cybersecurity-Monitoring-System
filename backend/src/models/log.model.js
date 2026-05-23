import mongoose from "mongoose";

/*
====================================================
LOG SCHEMA
Multi-tenant SaaS safe
====================================================
*/

const logSchema = new mongoose.Schema(
  {
    /*
    ====================================================
    TENANT OWNERSHIP
    ====================================================
    */

    user: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      required: true,

      index: true,
    },

    organizationId: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "Organization",

      default: null,

      index: true,
    },

    deviceId: {
      type: String,

      default: null,

      trim: true,
    },

    /*
    ====================================================
    BASIC REQUEST INFO
    ====================================================
    */

    ip: {
      type: String,

      required: true,

      trim: true,

      lowercase: true,

      index: true,
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

      uppercase: true,

      enum: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    },

    statusCode: {
      type: Number,

      default: 200,

      min: 100,

      max: 599,
    },

    bytes: {
      type: Number,

      default: 0,

      min: 0,
    },

    user_agent: {
      type: String,

      default: "unknown",

      maxlength: 500,
    },

    referrer: {
      type: String,

      default: "-",

      maxlength: 1000,
    },

    timestamp: {
      type: Date,

      default: Date.now,

      index: true,
    },

    /*
    ====================================================
    ML OUTPUT
    ====================================================
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

    versionKey: false,
  },
);

/*
====================================================
PERFORMANCE INDEXES
====================================================
*/

/*
Dashboard queries
*/

logSchema.index({
  user: 1,
  createdAt: -1,
});

/*
User IP history
*/

logSchema.index({
  user: 1,
  ip: 1,
  createdAt: -1,
});

/*
Threat analytics
*/

logSchema.index({
  user: 1,
  attackType: 1,
  createdAt: -1,
});

/*
Fast anomaly lookup
*/

logSchema.index({
  user: 1,
  is_anomaly: 1,
  createdAt: -1,
});

/*
IP based searches
*/

logSchema.index({
  ip: 1,
  createdAt: -1,
});

/*
Organization analytics
*/

logSchema.index({
  organizationId: 1,
  createdAt: -1,
});

/*
====================================================
MODEL EXPORT
====================================================
*/

const Log = mongoose.models.Log || mongoose.model("Log", logSchema);

export default Log;
