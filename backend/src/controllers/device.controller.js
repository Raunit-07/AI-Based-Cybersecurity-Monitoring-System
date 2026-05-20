import Device from "../models/device.model.js";

import catchAsync from "../utils/catchAsync.js";
import apiResponse from "../utils/apiResponse.js";

import {
    emitDeviceOnline
} from "../services/realtime.service.js";


/**
 * ============================================
 * GET OWNER ID
 * ============================================
 */
const getOwnerId = (req) => {

    return (

        req.user?._id ||

        req.device?.userId ||

        null

    );

};



/**
 * ============================================
 * REGISTER DEVICE
 * ============================================
 */
export const registerDevice =
    catchAsync(
        async (
            req,
            res
        ) => {

            const {

                deviceId,
                hostname,
                os,
                agentVersion,
                localIp,
                metadata

            } = req.body;


            const ownerId =
                getOwnerId(req);


            if (
                !ownerId
            ) {

                return apiResponse(

                    res,
                    401,
                    false,
                    null,
                    "Unauthorized"

                );

            }


            if (
                !deviceId ||
                !hostname ||
                !os
            ) {

                return apiResponse(

                    res,
                    400,
                    false,
                    null,
                    "Missing required fields"

                );

            }


            /**
             * Prevent cross-user device collisions
             */
            const existingDevice =
                await Device.findOne({

                    deviceId,

                    userId:
                        ownerId

                })
                    .select(
                        "+apiKey"
                    );



            if (
                existingDevice
            ) {

                const now =
                    new Date();


                existingDevice.lastSeen =
                    now;

                existingDevice.heartbeatAt =
                    now;

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

                    ...(metadata || {})

                };


                await existingDevice.save();


                emitDeviceOnline(

                    req.io,

                    existingDevice,

                    ownerId

                );


                return apiResponse(

                    res,
                    200,
                    true,

                    {

                        deviceId:
                            existingDevice.deviceId,

                        apiKey:
                            existingDevice.apiKey,

                        status:
                            existingDevice.status,

                        reconnect: true

                    },

                    "Device reconnected successfully"

                );

            }


            /**
             * API key auto-generated
             * by schema middleware
             */
            const now =
                new Date();


            const device =
                await Device.create({

                    deviceId,

                    hostname,

                    os,

                    userId:
                        ownerId,

                    agentVersion:
                        agentVersion ||
                        "1.0.0",

                    status:
                        "online",

                    lastSeen:
                        now,

                    heartbeatAt:
                        now,

                    ipAddress:
                        req.ip,

                    localIp:
                        localIp || "",

                    metadata: {

                        architecture:
                            metadata?.architecture || "",

                        platform:
                            metadata?.platform || "",

                        cpuUsage:
                            metadata?.cpuUsage || 0,

                        memoryUsage:
                            metadata?.memoryUsage || 0

                    }

                });


            emitDeviceOnline(

                req.io,

                device,

                ownerId

            );


            return apiResponse(

                res,
                201,
                true,

                {

                    deviceId:
                        device.deviceId,

                    apiKey:
                        device.apiKey,

                    status:
                        device.status,

                    reconnect: false

                },

                "Device registered successfully"

            );

        }
    );



/**
 * ============================================
 * HEARTBEAT
 * ============================================
 */
export const heartbeatDevice =
    catchAsync(
        async (
            req,
            res
        ) => {

            const {

                deviceId

            } = req.body;


            const ownerId =
                getOwnerId(req);


            if (
                !ownerId
            ) {

                return apiResponse(

                    res,
                    401,
                    false,
                    null,
                    "Unauthorized"

                );

            }


            if (
                !deviceId
            ) {

                return apiResponse(

                    res,
                    400,
                    false,
                    null,
                    "Device ID required"

                );

            }


            const device =
                await Device.findOne({

                    deviceId,

                    userId:
                        ownerId

                });


            if (
                !device
            ) {

                return apiResponse(

                    res,
                    404,
                    false,
                    null,
                    "Device not found"

                );

            }


            const now =
                new Date();

            device.status =
                "online";

            device.lastSeen =
                now;

            device.heartbeatAt =
                now;

            await device.save();


            emitDeviceOnline(

                req.io,

                device,

                ownerId

            );


            return apiResponse(

                res,
                200,
                true,

                {

                    deviceId:
                        device.deviceId,

                    status:
                        device.status,

                    heartbeatAt:
                        device.heartbeatAt

                },

                "Heartbeat updated"

            );

        }
    );



/**
 * ============================================
 * GET DEVICES
 * ============================================
 */
export const getDevices =
    catchAsync(
        async (
            req,
            res
        ) => {

            const ownerId =
                getOwnerId(req);


            if (
                !ownerId
            ) {

                return apiResponse(

                    res,
                    401,
                    false,
                    null,
                    "Unauthorized"

                );

            }


            const devices =
                await Device.find({

                    userId:
                        ownerId

                })
                    .sort({

                        updatedAt: -1

                    })
                    .select(
                        "-apiKey"
                    );


            return apiResponse(

                res,
                200,
                true,

                {

                    devices

                },

                "Devices fetched"

            );

        }
    );