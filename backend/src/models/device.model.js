import crypto from "crypto";
import mongoose from "mongoose";

/**
 * ==========================================
 * DEVICE SCHEMA
 * ==========================================
 */

const deviceSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      minlength: 10,
      maxlength: 255,
    },

    hostname: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },

    os: {
      type: String,
      required: true,
      trim: true,

      enum: [
        "windows",
        "linux",
        "macos",
        "ubuntu",
        "debian",
        "centos",
        "unknown",
      ],

      default: "unknown",
    },

    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /*
    ==================================
    STORED HASH ONLY
    ==================================
    */

    apiKey: {
      type: String,

      required: true,

      select: false,

      index: true,
    },

    status: {
      type: String,

      enum: ["online", "offline", "inactive", "quarantined"],

      default: "offline",

      index: true,
    },

    lastSeen: {
      type: Date,
      default: Date.now,
      index: true,
    },

    heartbeatAt: {
      type: Date,
      default: Date.now,
    },

    agentVersion: {
      type: String,
      default: "1.0.0",
    },

    ipAddress: {
      type: String,
      default: "",
    },

    localIp: {
      type: String,
      default: "",
    },

    metadata: {
      architecture: {
        type: String,
        default: "",
      },

      platform: {
        type: String,
        default: "",
      },

      cpuUsage: {
        type: Number,
        default: 0,
      },

      memoryUsage: {
        type: Number,
        default: 0,
      },
    },

    compromised: {
      type: Boolean,
      default: false,
      index: true,
    },

    isolated: {
      type: Boolean,
      default: false,
    },
  },

  {
    timestamps: true,
    versionKey: false,
  },
);

/*
==================================
INDEXES
==================================
*/

deviceSchema.index({
  organizationId: 1,
  userId: 1,
});

deviceSchema.index({
  status: 1,
  lastSeen: -1,
});

deviceSchema.index({
  compromised: 1,
});

deviceSchema.index({
  deviceId: 1,
});

/*
==================================
STATIC METHODS
==================================
*/

deviceSchema.statics.hashApiKey = function (apiKey) {
  return crypto.createHash("sha256").update(apiKey).digest("hex");
};

/*
==================================
INSTANCE METHODS
==================================
*/

deviceSchema.methods.compareApiKey = function (candidateKey) {
  const hashedCandidate = crypto
    .createHash("sha256")
    .update(candidateKey)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(this.apiKey),

    Buffer.from(hashedCandidate),
  );
};

/*
==================================
SAFE JSON
==================================
*/

deviceSchema.methods.toJSON = function () {
  const obj = this.toObject();

  delete obj.apiKey;

  return obj;
};

const Device = mongoose.models.Device || mongoose.model("Device", deviceSchema);

export default Device;
