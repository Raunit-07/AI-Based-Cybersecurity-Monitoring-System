import Device from "../models/device.model.js";

/**
 * =====================================
 * DEVICE AUTH MIDDLEWARE
 * =====================================
 */
export const deviceAuth =
    async (
        req,
        res,
        next
    ) => {
        try {
            const deviceId =
                req.headers[
                "x-device-id"
                ];

            const apiKey =
                req.headers[
                "x-device-key"
                ];

            // ================= VALIDATION =================
            if (
                !deviceId ||
                !apiKey
            ) {
                return res.status(401).json({
                    success: false,
                    message:
                        "Device credentials missing",
                });
            }

            // ================= FIND DEVICE =================
            const device =
                await Device.findOne({
                    deviceId,
                    apiKey,
                });

            if (!device) {
                return res.status(401).json({
                    success: false,
                    message:
                        "Invalid device credentials",
                });
            }

            // ================= UPDATE HEARTBEAT =================
            device.lastSeen =
                new Date();

            device.status =
                "online";

            await device.save();

            // ================= ATTACH DEVICE =================
            req.device =
                device;

            next();
        } catch (error) {
            console.error(
                "❌ Device auth error:",
                error.message
            );

            return res.status(500).json({
                success: false,
                message:
                    "Device authentication failed",
            });
        }
    };