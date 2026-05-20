import mongoose from "mongoose";
import validator from "validator";

const alertSchema = new mongoose.Schema(
  {
    /**
     * ============================================
     * ALERT OWNER
     * ============================================
     */
    user: {

      type:
        mongoose.Schema.Types.ObjectId,

      ref: "User",

      required: true,

      immutable: true,

      index: true
    },



    /**
     * ============================================
     * DEVICE
     * ============================================
     */
    deviceId: {

      type: String,

      default: null,

      index: true
    },



    /**
     * ============================================
     * IP
     * ============================================
     */
    ip: {

      type: String,

      required: true,

      trim: true,

      index: true,

      validate: {

        validator(value) {

          return validator.isIP(
            value.trim()
          );

        },

        message:
          "Invalid IP"

      }

    },



    /**
     * ============================================
     * ANOMALY SCORE
     *
     * STANDARDIZED:
     * 0 = normal
     * 1 = critical
     * ============================================
     */
    anomalyScore: {

      type: Number,

      required: true,

      min: 0,

      max: 1,

      default: 0
    },



    /**
     * ============================================
     * THREAT SCORE
     * ============================================
     */
    threatScore: {

      type: Number,

      default: 0,

      index: true
    },



    /**
     * ============================================
     * ATTACK TYPE
     * ============================================
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

        "Normal"

      ],

      default:
        "Suspicious",

      index: true

    },



    /**
     * ============================================
     * INTERNAL TYPE
     * ============================================
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

        "unknown"

      ],

      default:
        "unknown",

      index: true

    },



    /**
     * ============================================
     * SEVERITY
     * ============================================
     */
    severity: {

      type: String,

      enum: [

        "low",

        "medium",

        "high",

        "critical"

      ],

      default: "medium",

      index: true

    },



    /**
     * ============================================
     * MESSAGE
     * ============================================
     */
    message: {

      type: String,

      trim: true,

      maxlength: 500,

      default:
        "Threat detected"

    },



    /**
     * ============================================
     * STATUS
     * ============================================
     */
    status: {

      type: String,

      enum: [

        "active",

        "investigating",

        "resolved",

        "closed"

      ],

      default: "active",

      index: true

    },



    /**
     * ============================================
     * ASSIGNED ANALYST
     * ============================================
     */
    assignedTo: {

      type:
        mongoose.Schema.Types.ObjectId,

      ref: "User",

      default: null
    },



    /**
     * ============================================
     * NOTES
     * ============================================
     */
    notes: [{

      text: String,

      createdAt: {

        type: Date,

        default: Date.now

      }

    }],



    /**
     * ============================================
     * RESOLUTION
     * ============================================
     */
    resolved: {

      type: Boolean,

      default: false,

      index: true

    },



    resolvedAt: {

      type: Date,

      default: null
    },



    /**
     * ============================================
     * SOURCE
     * ============================================
     */
    source: {

      type: String,

      default: "nginx"

    },



    /**
     * ============================================
     * GEO
     * ============================================
     */
    geo: {

      country: {

        type: String,

        default: ""

      },

      city: {

        type: String,

        default: ""

      }

    },



    /**
     * ============================================
     * META
     * ============================================
     */
    meta: {

      requests: {

        type: Number,

        default: 0

      },

      failedLogins: {

        type: Number,

        default: 0

      },

      blocked: {

        type: Boolean,

        default: false

      }

    },



    /**
     * ============================================
     * SOFT DELETE
     * ============================================
     */
    isDeleted: {

      type: Boolean,

      default: false
    },



    timestamp: {

      type: Date,

      default: Date.now,

      index: true

    }

  },
  {

    timestamps: true,

    versionKey: false,

    strict: true

  }
);



/**
 * ============================================
 * INDEXES
 * ============================================
 */

alertSchema.index({

  user: 1,

  createdAt: -1

});


alertSchema.index({

  user: 1,

  ip: 1,

  createdAt: -1

});


alertSchema.index({

  user: 1,

  severity: 1,

  createdAt: -1

});


alertSchema.index({

  user: 1,

  attackType: 1,

  createdAt: -1

});


alertSchema.index({

  user: 1,

  status: 1,

  resolved: 1

});


alertSchema.index({

  user: 1,

  threatScore: -1

});



/**
 * ============================================
 * SAFE JSON
 * ============================================
 */

alertSchema.methods.toJSON =
  function () {

    const obj =
      this.toObject();

    delete obj.__v;

    return obj;

  };



const Alert =

  mongoose.models.Alert ||

  mongoose.model(
    "Alert",
    alertSchema
  );

export default Alert;