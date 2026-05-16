import Device from "../models/device.model.js";

export const monitorDevices =
    async () => {
        try {
            const threshold =
                new Date(
                    Date.now() - 60000
                );

            await Device.updateMany(
                {
                    heartbeatAt: {
                        $lt: threshold,
                    },
                },

                {
                    status: "offline",
                }
            );
        } catch (error) {
            console.error(
                "❌ Device monitor error:",
                error
            );
        }
    };