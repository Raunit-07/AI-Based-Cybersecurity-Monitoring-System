import mongoose from "mongoose";
import validator from "validator";

const alertSchema = new mongoose.Schema(
  {
    // ================= ALERT OWNER =================
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ================= SOURCE IP =================
    ip: {
      type: String,
      required: [true, "IP address is required"],
      trim: true,
      index: true,

      validate: {
        validator: function (value) {
          return validator.isIP(value);
        },

        message: "Invalid IP address format",
      },
    },

    // ================= ML SCORE =================
    anomalyScore: {
      type: Number,
      required: true,
      min: -1,
      max: 1,
      default: 0,
    },

    // ================= ATTACK TYPE =================
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
      index: true,
    },

    // ================= INTERNAL CLASSIFICATION =================
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
      index: true,
    },

    // ================= SEVERITY =================
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
      index: true,
    },

    // ================= HUMAN MESSAGE =================
    message: {
      type: String,
      trim: true,
      default: "Threat detected",
    },

    // ================= RAW LOG =================
    rawLog: {
      type: String,
      trim: true,
      default: "",
    },

    // ================= STATUS =================
    status: {
      type: String,

      enum: [
        "active",
        "investigating",
        "resolved",
      ],

      default: "active",
      index: true,
    },

    // ================= RESOLVED FLAG =================
    resolved: {
      type: Boolean,
      default: false,
      index: true,
    },

    // ================= ALERT SOURCE =================
    source: {
      type: String,
      default: "nginx",
      trim: true,
    },

    // ================= GEOLOCATION =================
    geo: {
      country: {
        type: String,
        default: "",
      },

      city: {
        type: String,
        default: "",
      },
    },

    // ================= EXTRA METADATA =================
    meta: {
      requests: {
        type: Number,
        default: 0,
      },

      failedLogins: {
        type: Number,
        default: 0,
      },

      blocked: {
        type: Boolean,
        default: false,
      },
    },

    // ================= EVENT TIME =================
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },

  {
    timestamps: true,
    versionKey: false,
  }
);

// ================= PERFORMANCE INDEXES =================
alertSchema.index({
  user: 1,
  createdAt: -1,
});

alertSchema.index({
  user: 1,
  ip: 1,
  createdAt: -1,
});

alertSchema.index({
  severity: 1,
  createdAt: -1,
});

alertSchema.index({
  attackType: 1,
  createdAt: -1,
});

alertSchema.index({
  status: 1,
  resolved: 1,
});

// ================= SAFE JSON OUTPUT =================
alertSchema.methods.toJSON =
  function () {
    const obj = this.toObject();

    delete obj.__v;

    return obj;
  };

// ================= SAFE MODEL EXPORT =================
const Alert =
  mongoose.models.Alert ||
  mongoose.model(
    "Alert",
    alertSchema
  );

export default Alert;