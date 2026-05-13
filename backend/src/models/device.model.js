import mongoose from "mongoose";

/**
 * ==========================================
 * DEVICE SCHEMA
 * ==========================================
 * Represents:
 * - laptops
 * - desktops
 * - servers
 * - VMs
 * - cloud instances
 *
 * Used for:
 * - endpoint monitoring
 * - telemetry ownership
 * - multi-tenant isolation
 * - device health tracking
 * ==========================================
 */

const deviceSchema =
    new mongoose.Schema(
        {
            // ================= DEVICE ID =================
            deviceId: {
                type: String,

                required: true,

                unique: true,

                index: true,

                trim: true,

                minlength: 10,

                maxlength: 255,
            },

            // ================= HOSTNAME =================
            hostname: {
                type: String,

                required: true,

                trim: true,

                maxlength: 255,
            },

            // ================= OPERATING SYSTEM =================
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

            // ================= ORGANIZATION =================
            organizationId: {
                type:
                    mongoose.Schema.Types
                        .ObjectId,

                ref: "Organization",

                required: false,

                default: null,

                index: true,
            },

            // ================= OWNER USER =================
            userId: {
                type:
                    mongoose.Schema.Types
                        .ObjectId,

                ref: "User",

                required: true,

                index: true,
            },

            // ================= DEVICE API KEY =================
            apiKey: {
                type: String,

                required: true,

                unique: true,

                index: true,

                select: false,
            },

            // ================= DEVICE STATUS =================
            status: {
                type: String,

                enum: [
                    "online",
                    "offline",
                    "inactive",
                    "quarantined",
                ],

                default: "offline",

                index: true,
            },

            // ================= LAST ACTIVE =================
            lastSeen: {
                type: Date,

                default: Date.now,

                index: true,
            },

            // ================= HEARTBEAT =================
            heartbeatAt: {
                type: Date,

                default: Date.now,
            },

            // ================= AGENT VERSION =================
            agentVersion: {
                type: String,

                default: "1.0.0",

                trim: true,
            },

            // ================= PUBLIC IP =================
            ipAddress: {
                type: String,

                default: "",

                trim: true,
            },

            // ================= INTERNAL IP =================
            localIp: {
                type: String,

                default: "",

                trim: true,
            },

            // ================= DEVICE METADATA =================
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

            // ================= SECURITY FLAGS =================
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
        }
    );

/**
 * ==========================================
 * INDEXES
 * ==========================================
 */

// Multi-tenant filtering
deviceSchema.index({
    organizationId: 1,
    userId: 1,
});

// Device health queries
deviceSchema.index({
    status: 1,
    lastSeen: -1,
});

// Threat hunting
deviceSchema.index({
    compromised: 1,
});

// Fast device lookup
deviceSchema.index({
    deviceId: 1,
});

/**
 * ==========================================
 * SAFE JSON OUTPUT
 * ==========================================
 */
deviceSchema.methods.toJSON =
    function () {
        const obj =
            this.toObject();

        // Never expose apiKey
        delete obj.apiKey;

        return obj;
    };

/**
 * ==========================================
 * SAFE MODEL EXPORT
 * ==========================================
 */
const Device =
    mongoose.models.Device ||
    mongoose.model(
        "Device",
        deviceSchema
    );

export default Device;