import apiResponse from "../utils/apiResponse.js";
import catchAsync from "../utils/catchAsync.js";

import * as deviceService from "../services/device.service.js";
import { emitDeviceOnline } from "../services/realtime.service.js";
import { mapOS } from "../utils/osMapper.js";
import { validateUpdate } from "../validators/device.validator.js";

/**
 * ============================================
 * GET OWNER ID
 * ============================================
 */
const getOwnerId = (req) => {
  return req.user?._id || req.device?.userId || req.systemUser?._id || null;
};

/**
 * ============================================
 * REGISTER DEVICE
 * ============================================
 */

export const registerDevice = catchAsync(async (req, res) => {
  // Debug incoming request
  console.log("========== DEVICE REGISTER REQUEST ==========");
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);
  console.log("User:", req.user?._id || null);
  console.log("Device:", req.device || null);
  console.log("============================================");

  // Normalize OS
  if (req.body && req.body.os) {
    req.body.os = mapOS(req.body.os);
  }

  const result = await deviceService.registerDeviceService({
    req,
    res,
  });

  return result;
});

/**
 * ============================================
 * HEARTBEAT
 * ============================================
 */

export const heartbeatDevice = catchAsync(async (req, res) => {
  const { deviceId } = req.body;

  const ownerId = getOwnerId(req);

  if (!ownerId) {
    return apiResponse(res, 401, false, null, "Unauthorized");
  }

  if (!deviceId) {
    return apiResponse(res, 400, false, null, "Device ID required");
  }

  const device = await deviceService.heartbeatService({
    ownerId,
    deviceId,
    io: req.io,
  });

  if (!device) {
    return apiResponse(res, 404, false, null, "Device not found");
  }

  emitDeviceOnline(
    req.io,

    {
      deviceId: device.deviceId,

      hostname: device.hostname,

      status: device.status,

      lastSeen: device.lastSeen,
    },

    ownerId,
  );

  return apiResponse(
    res,
    200,
    true,

    {
      deviceId: device.deviceId,

      status: device.status,

      heartbeatAt: device.heartbeatAt,
    },

    "Heartbeat updated",
  );
});

/**
 * ============================================
 * GET DEVICES
 * ============================================
 */

export const getDevices = catchAsync(async (req, res) => {
  const ownerId = getOwnerId(req);

  if (!ownerId) {
    return apiResponse(res, 401, false, null, "Unauthorized");
  }

  const devices = await deviceService.getDevicesService(ownerId);

  return apiResponse(
    res,
    200,
    true,

    {
      devices,
    },

    "Devices fetched",
  );
});

// ---------------------------------------------------
// GET DEVICE BY ID
// ---------------------------------------------------
export const getDeviceById = catchAsync(async (req, res) => {
  const ownerId = getOwnerId(req);
  if (!ownerId) {
    return apiResponse(res, 401, false, null, "Unauthorized");
  }

  const { id } = req.params; // deviceId
  const device = await deviceService.getDeviceByIdService(ownerId, id);
  if (!device) {
    return apiResponse(res, 404, false, null, "Device not found");
  }

  return apiResponse(res, 200, true, { device }, "Device fetched");
});

// ---------------------------------------------------
// UPDATE DEVICE
// ---------------------------------------------------
export const updateDevice = catchAsync(async (req, res) => {
  const ownerId = getOwnerId(req);
  if (!ownerId) {
    return apiResponse(res, 401, false, null, "Unauthorized");
  }

  const { id } = req.params; // deviceId

  // Normalize OS
  if (req.body && req.body.os) {
    req.body.os = mapOS(req.body.os);
  }

  const errors = validateUpdate(req.body);
  if (errors.length) {
    return apiResponse(res, 400, false, null, errors.join(", "));
  }

  const device = await deviceService.updateDeviceService({
    ownerId,
    deviceId: id,
    payload: req.body,
    io: req.io,
  });
  if (!device) {
    return apiResponse(res, 404, false, null, "Device not found");
  }

  // Emit updated status via realtime
  emitDeviceOnline(
    req.io,
    {
      deviceId: device.deviceId,
      hostname: device.hostname,
      status: device.status,
      lastSeen: device.lastSeen,
    },
    ownerId,
  );

  return apiResponse(
    res,
    200,
    true,
    { deviceId: device.deviceId },
    "Device updated",
  );
});
