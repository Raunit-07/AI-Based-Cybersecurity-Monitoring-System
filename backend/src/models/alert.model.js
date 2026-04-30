import mongoose from "mongoose";

const alertSchema = new mongoose.Schema(
  {
    ip: {
      type: String,
      required: true,
      index: true,
    },

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
    },

    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Alert", alertSchema);