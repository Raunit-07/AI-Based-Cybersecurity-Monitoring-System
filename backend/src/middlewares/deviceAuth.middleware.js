import Device from "../models/device.model.js";

/**
 * ==================================================
 * DEVICE AUTH MIDDLEWARE
 * ==================================================
 * Authenticates:
 * - collector agents
 * - endpoint devices
 *
 * Uses:
 * x-device-id
 * x-device-key
 * ==================================================
 */
export const deviceAuthMiddleware =
    async (req, res, next) => {
        try {
            /**
             * ==========================================
             * HEADERS
             * ==========================================
             */
            const deviceId =
                req.headers[
                "x-device-id"
                ];

            const deviceKey =
                req.headers[
                "x-device-key"
                ];

            /**
             * ==========================================
             * VALIDATION
             * ==========================================
             */
            if (
                !deviceId ||
                !deviceKey
            ) {
                return res.status(401).json({
                    success: false,

                    data: null,

                    message:
                        "Missing device credentials",
                });
            }

            /**
             * ==========================================
             * FIND DEVICE
             * ==========================================
             */
            const device =
                await Device.findOne({
                    deviceId,
                }).select("+apiKey");

            /**
             * ==========================================
             * DEVICE NOT FOUND
             * ==========================================
             */
            if (!device) {
                return res.status(404).json({
                    success: false,

                    data: null,

                    message:
                        "Device not found",
                });
            }

            /**
             * ==========================================
             * INVALID KEY
             * ==========================================
             */
            if (
                device.apiKey !==
                deviceKey
            ) {
                return res.status(403).json({
                    success: false,

                    data: null,

                    message:
                        "Invalid device key",
                });
            }

            /**
             * ==========================================
             * INACTIVE DEVICE
             * ==========================================
             */
            if (
                device.isActive ===
                false
            ) {
                return res.status(403).json({
                    success: false,

                    data: null,

                    message:
                        "Device disabled",
                });
            }

            /**
             * ==========================================
             * ATTACH DEVICE
             * ==========================================
             */
            req.device = device;

            next();

        } catch (error) {
            console.error(
                "❌ Device auth error:",
                error
            );

            return res.status(500).json({
                success: false,

                data: null,

                message:
                    "Device authentication failed",
            });
        }
    };