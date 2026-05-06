import mongoose from "mongoose";

const logSchema = new mongoose.Schema(
  {
    // ================= BASIC INFO =================

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
      max: 100000, // increased for DDoS realism
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
      enum: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
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

    // ================= ML OUTPUT =================

    is_anomaly: {
      type: Boolean,
      default: false,
      index: true, // 🔥 important for filtering
    },

    anomaly_score: {
      type: Number,
      default: 0,
    },

    attackType: {
      type: String,
      enum: ["normal", "ddos", "bruteforce", "suspicious"],
      default: "normal",
      index: true, // 🔥 important for analytics
    },
  },
  {
    timestamps: true,
    strict: true,
  }
);

// ================= INDEXES (PERFORMANCE) =================
logSchema.index({ ip: 1, timestamp: -1 });
logSchema.index({ attackType: 1, timestamp: -1 });

export default mongoose.model("Log", logSchema);