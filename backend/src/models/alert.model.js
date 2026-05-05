import mongoose from "mongoose";
import validator from "validator";

const alertSchema = new mongoose.Schema(
  {
    ip: {
      type: String,
      required: [true, "IP address is required"],
      index: true,
      trim: true,
      validate: {
        validator: function (value) {
          return validator.isIP(value);
        },
        message: "Invalid IP address format",
      },
    },

    // 🔥 ML OUTPUT (IMPORTANT)
    anomalyScore: {
      type: Number,
      required: [true, "Anomaly score is required"],
      min: -1,
      max: 1,
    },

    attackType: {
      type: String,
      required: true,
      enum: ["DDoS", "Brute Force", "Suspicious", "Normal"],
      default: "Suspicious",
    },

    // 🔥 SYSTEM CLASSIFICATION (KEEP YOUR EXISTING LOGIC)
    type: {
      type: String,
      required: true,
      enum: ["ddos", "bruteforce", "suspicious", "unknown"],
      default: "unknown",
    },

    severity: {
      type: String,
      required: true,
      enum: ["low", "medium", "high", "critical"],
      default: "high",
      index: true,
    },

    // 🔥 TRACK STATE
    resolved: {
      type: Boolean,
      default: false,
      index: true,
    },

    // 🔥 OPTIONAL METADATA (VERY USEFUL)
    meta: {
      requests: {
        type: Number,
        default: 0,
      },
      failedLogins: {
        type: Number,
        default: 0,
      },
    },

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

// 🔥 INDEXING FOR PERFORMANCE
alertSchema.index({ ip: 1, createdAt: -1 });
alertSchema.index({ severity: 1, createdAt: -1 });

// 🔥 SAFE JSON OUTPUT
alertSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

export default mongoose.model("Alert", alertSchema);