import crypto from "crypto";

import Device from "../models/device.model.js";

/**
 * ==================================================
 * REGISTER DEVICE
 * ==================================================
 * Real endpoint registration flow:
 *
 * 1. Agent connects
 * 2. If device exists:
 *    - update heartbeat
 *    - set online
 *    - return existing apiKey
 *
 * 3. Else:
 *    - create new device
 *    - generate apiKey
 *
 * Production-safe:
 * - reconnect support
 * - multi-user ready
 * - telemetry ready
 * ==================================================
 */
export const registerDevice = async (req, res) => {
    try {
        const {
            deviceId,
            hostname,
            os,
            agentVersion,
            localIp,
            metadata,
        } = req.body;

        /**
         * ================= VALIDATION =================
         */
        if (
            !deviceId ||
            !hostname ||
            !os
        ) {
            return res.status(400).json({
                success: false,

                data: null,

                message:
                    "Missing required fields",
            });
        }

        /**
         * ================= FIND EXISTING DEVICE =================
         */
        const existingDevice =
            await Device.findOne({
                deviceId,
            }).select("+apiKey");

        /**
         * ==================================================
         * DEVICE RECONNECT FLOW
         * ==================================================
         * Real agents reconnect frequently.
         * Never reject reconnects.
         * ==================================================
         */
        if (existingDevice) {
            existingDevice.lastSeen =
                new Date();

            existingDevice.heartbeatAt =
                new Date();

            existingDevice.status =
                "online";

            existingDevice.hostname =
                hostname;

            existingDevice.os =
                os;

            existingDevice.agentVersion =
                agentVersion ||
                existingDevice.agentVersion;

            existingDevice.localIp =
                localIp ||
                existingDevice.localIp;

            existingDevice.ipAddress =
                req.ip;

            existingDevice.metadata = {
                ...existingDevice.metadata,
                ...(metadata || {}),
            };

            await existingDevice.save();

            /**
 * ==========================================
 * REALTIME SOCKET EVENT
 * ==========================================
 */
            if (req.io) {
                req.io.emit(
                    "device_online",

                    {
                        deviceId:
                            existingDevice.deviceId,

                        hostname:
                            existingDevice.hostname,

                        status:
                            existingDevice.status,

                        os:
                            existingDevice.os,

                        lastSeen:
                            existingDevice.lastSeen,
                    }
                );
            }

            return res.status(200).json({
                success: true,

                data: {
                    deviceId:
                        existingDevice.deviceId,

                    apiKey:
                        existingDevice.apiKey,

                    status:
                        existingDevice.status,

                    reconnect: true,
                },

                message:
                    "Device reconnected successfully",
            });
        }

        /**
         * ================= GENERATE API KEY =================
         */
        const apiKey =
            crypto
                .randomBytes(32)
                .toString("hex");

        /**
         * ================= CREATE DEVICE =================
         */
        const device =
            await Device.create({
                deviceId,

                hostname,

                os,

                agentVersion:
                    agentVersion || "1.0.0",

                userId:
                    req.user._id,

                apiKey,

                status: "online",

                lastSeen:
                    new Date(),

                heartbeatAt:
                    new Date(),

                ipAddress:
                    req.ip,

                localIp:
                    localIp || "",

                metadata: {
                    architecture:
                        metadata?.architecture ||
                        "",

                    platform:
                        metadata?.platform ||
                        "",

                    cpuUsage:
                        metadata?.cpuUsage || 0,

                    memoryUsage:
                        metadata?.memoryUsage || 0,
                },
            });

        /**
* ==========================================
* REALTIME SOCKET EVENT
* ==========================================
*/
        if (req.io) {
            req.io.emit(
                "device_online",

                {
                    deviceId:
                        device.deviceId,

                    hostname:
                        device.hostname,

                    status:
                        device.status,

                    os:
                        device.os,

                    lastSeen:
                        device.lastSeen,
                }
            );
        }



        /**
         * ================= SUCCESS =================
         */
        return res.status(201).json({
            success: true,

            data: {
                deviceId:
                    device.deviceId,

                apiKey:
                    apiKey,

                status:
                    device.status,

                reconnect: false,
            },

            message:
                "Device registered successfully",
        });

    } catch (error) {
        console.error(
            "❌ Device registration error:",
            error
        );

        return res.status(500).json({
            success: false,

            data: null,

            message:
                "Device registration failed",
        });
    }
};

/**
 * ==================================================
 * DEVICE HEARTBEAT
 * ==================================================
 * Updates:
 * - online status
 * - heartbeat
 * - lastSeen
 *
 * Used by:
 * collector-agent
 * endpoint daemon
 * ==================================================
 */
export const heartbeatDevice =
    async (req, res) => {
        try {
            const {
                deviceId,
            } = req.body;

            if (!deviceId) {
                return res.status(400).json({
                    success: false,

                    data: null,

                    message:
                        "Device ID required",
                });
            }

            const device =
                await Device.findOne({
                    deviceId,
                });

            if (!device) {
                return res.status(404).json({
                    success: false,

                    data: null,

                    message:
                        "Device not found",
                });
            }

            device.status =
                "online";

            device.lastSeen =
                new Date();

            device.heartbeatAt =
                new Date();

            await device.save();

            /**
 * ==========================================
 * REALTIME SOCKET EVENT
 * ==========================================
 */
            if (req.io) {
                req.io.emit(
                    "device_online",

                    {
                        deviceId:
                            device.deviceId,

                        hostname:
                            device.hostname,

                        status:
                            device.status,

                        os:
                            device.os,

                        lastSeen:
                            device.lastSeen,
                    }
                );
            }

            return res.status(200).json({
                success: true,

                data: {
                    deviceId:
                        device.deviceId,

                    status:
                        device.status,

                    heartbeatAt:
                        device.heartbeatAt,
                },

                message:
                    "Heartbeat updated successfully",
            });

        } catch (error) {
            console.error(
                "❌ Heartbeat error:",
                error
            );

            return res.status(500).json({
                success: false,

                data: null,

                message:
                    "Heartbeat failed",
            });
        }
    };


/**
* ==================================================
* GET USER DEVICES
* ==================================================
* Returns ONLY devices
* owned by logged-in user.
*
* Multi-tenant safe.
* ==================================================
*/
export const getDevices =
    async (req, res) => {
        try {
            /**
             * ==========================================
             * AUTH CHECK
             * ==========================================
             */
            if (!req.user?._id) {
                return res.status(401).json({
                    success: false,

                    data: null,

                    message:
                        "Unauthorized",
                });
            }

            /**
             * ==========================================
             * FETCH DEVICES
             * ==========================================
             */
            const devices =
                await Device.find({
                    userId:
                        req.user._id,
                })
                    .sort({
                        updatedAt: -1,
                    })
                    .select(
                        "-apiKey"
                    );

            /**
             * ==========================================
             * ENRICH DEVICE DATA
             * ==========================================
             */
            const formattedDevices =
                devices.map(
                    (device) => ({
                        _id: device._id,

                        deviceId:
                            device.deviceId,

                        hostname:
                            device.hostname,

                        os:
                            device.os,

                        status:
                            device.status,

                        ipAddress:
                            device.ipAddress,

                        localIp:
                            device.localIp,

                        lastSeen:
                            device.lastSeen,

                        heartbeatAt:
                            device.heartbeatAt,

                        agentVersion:
                            device.agentVersion,

                        /**
                         * ======================================
                         * PLACEHOLDERS FOR FUTURE ANALYTICS
                         * ======================================
                         */
                        threatCount:
                            device.threatCount ||
                            0,

                        riskScore:
                            device.riskScore ||
                            0,
                    })
                );

            /**
             * ==========================================
             * RESPONSE
             * ==========================================
             */
            return res.status(200).json({
                success: true,

                data: {
                    devices:
                        formattedDevices,
                },

                message:
                    "Devices fetched successfully",
            });

        } catch (error) {
            console.error(
                "❌ Get devices error:",
                error
            );

            return res.status(500).json({
                success: false,

                data: null,

                message:
                    "Failed to fetch devices",
            });
        }
    };