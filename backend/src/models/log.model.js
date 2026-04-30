import mongoose from "mongoose";

const logSchema = new mongoose.Schema(
  {
    // ✅ IP address
    ip: {
      type: String,
      required: true,
      index: true,
    },

    // ✅ Request count (DDoS detection)
    requests: {
      type: Number,
      required: true,
      min: 0,
      max: 10000,
    },

    // ✅ Failed login attempts (Brute force)
    failedLogins: {
      type: Number,
      default: 0,
      min: 0,
      max: 1000,
    },

    // ✅ API endpoint
    endpoint: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    // ✅ HTTP method
    method: {
      type: String,
      required: true,
      enum: ["GET", "POST", "PUT", "DELETE"],
    },

    // ✅ User agent
    user_agent: {
      type: String,
      default: "unknown",
      maxlength: 300,
    },

    // ✅ Timestamp
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },

    // ================= ML OUTPUT =================

    threatAnalyzed: {
      type: Boolean,
      default: false,
    },

    anomalyScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 1,
    },

    classification: {
      type: String,
      default: "normal",
      enum: ["normal", "ddos", "bruteforce", "suspicious"],
    },
  },
  {
    timestamps: true,
    strict: true,
  }
);

export default mongoose.model("Log", logSchema);