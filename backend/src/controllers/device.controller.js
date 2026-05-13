import crypto from "crypto";

import Device from "../models/device.model.js";

/**
 * ================= REGISTER DEVICE =================
 */
export const registerDevice =
    async (req, res) => {
        try {
            const {
                deviceId,
                hostname,
                os,
                agentVersion,
            } = req.body;

            // ================= VALIDATION =================
            if (
                !deviceId ||
                !hostname ||
                !os
            ) {
                return res
                    .status(400)
                    .json({
                        success: false,

                        message:
                            "Missing required fields",
                    });
            }

            // ================= CHECK EXISTING =================
            const existingDevice =
                await Device.findOne({
                    deviceId,
                });

            if (existingDevice) {
                return res
                    .status(409)
                    .json({
                        success: false,

                        message:
                            "Device already registered",
                    });
            }

            // ================= API KEY =================
            const apiKey =
                crypto.randomBytes(32)
                    .toString("hex");

            // ================= CREATE DEVICE =================
            const device =
                await Device.create({
                    deviceId,

                    hostname,

                    os,

                    agentVersion,

                    user: req.user._id,

                    apiKey,

                    ipAddress:
                        req.ip,
                });

            return res.status(201)
                .json({
                    success: true,

                    data: {
                        deviceId:
                            device.deviceId,

                        apiKey:
                            device.apiKey,
                    },

                    message:
                        "Device registered successfully",
                });
        } catch (error) {
            console.error(
                "❌ Device registration error:",
                error
            );

            return res
                .status(500)
                .json({
                    success: false,

                    message:
                        "Device registration failed",
                });
        }
    };