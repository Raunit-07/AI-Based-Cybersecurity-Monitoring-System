import Device from "../models/device.model.js";
import { emitDeviceOnline } from "../services/realtime.service.js";
import apiResponse from "../utils/apiResponse.js";

/**
 * Normalizes OS platform string to match schema enum.
 */
export const mapOS = (rawOs) => {
  if (!rawOs || typeof rawOs !== "string") return "unknown";
  const normalized = rawOs.toLowerCase().trim();
  if (normalized.startsWith("win")) return "windows";
  if (normalized.startsWith("darwin")) return "macos";
  if (normalized.startsWith("mac")) return "macos";
  if (normalized.startsWith("linux")) return "linux";
  if (normalized.startsWith("ubuntu")) return "ubuntu";
  if (normalized.startsWith("debian")) return "debian";
  if (normalized.startsWith("centos")) return "centos";
  return "unknown";
};

/**
 * Service to create a new device registration.
 * Returns the device document and the raw apiKey.
 */
export const registerDeviceService = async (args) => {
  let { ownerId, payload, io, req, res } = args || {};

  // Controller direct call support
  let isDirectControllerCall = false;

  if (req && res && !payload) {
    isDirectControllerCall = true;

    io = req.app?.get("io");

    ownerId = req.user?._id || req.device?.userId || req.systemUser?._id || null;

    payload = req.body;
  }

  console.log("========== REGISTER SERVICE ==========");
  console.log("REQ BODY:", payload);
  console.log("REQ USER:", ownerId);
  console.log("======================================");

  // Accept collector-agent OR frontend formats
  const {
    deviceId,
    DEVICE_ID,

    name,
    DEVICE_NAME,

    hostname,

    os,

    deviceType = "desktop",

    agentVersion = "1.0.0",

    localIp,

    ipAddress,

    metadata = {},
  } = payload || {};

  // Generate fallback values
  const finalDeviceId = deviceId || DEVICE_ID || `device-${Date.now()}`;

  const finalHostname = hostname || name || DEVICE_NAME || "Unknown Device";

  const finalOs = mapOS(os || process.platform || "unknown");

  // Validation
  const missing = [];

  if (!finalHostname) missing.push("hostname");
  if (!finalOs) missing.push("os");

  if (missing.length) {
    if (isDirectControllerCall) {
      return apiResponse(
        res,
        400,
        false,
        { missing },
        `Missing required fields: ${missing.join(", ")}`,
      );
    }

    throw new Error(`Missing required fields: ${missing.join(", ")}`);
  }

  // Existing device
  const existingDevice = await Device.findOne({
    deviceId: finalDeviceId,
    userId: ownerId,
  });

  if (existingDevice) {
    const now = new Date();

    existingDevice.lastSeen = now;
    existingDevice.heartbeatAt = now;
    existingDevice.status = "online";

    existingDevice.hostname = finalHostname;
    existingDevice.os = finalOs;

    existingDevice.agentVersion = agentVersion;

    existingDevice.localIp = localIp || existingDevice.localIp;

    existingDevice.ipAddress = ipAddress || req?.ip || "";

    existingDevice.metadata = {
      ...existingDevice.metadata,
      ...metadata,
    };

    await existingDevice.save();

    emitDeviceOnline(
      io,
      {
        deviceId: existingDevice.deviceId,
        hostname: existingDevice.hostname,
        status: existingDevice.status,
        lastSeen: existingDevice.lastSeen,
      },
      ownerId,
    );

    return isDirectControllerCall
      ? apiResponse(
          res,
          200,
          true,
          {
            deviceId: existingDevice.deviceId,
            reconnect: true,
          },
          "Device reconnected",
        )
      : {
          device: existingDevice,
          reconnect: true,
        };
  }

  // New device
  const { generateApiKey, hashApiKey } =
    await import("../utils/deviceKey.util.js");

  const rawApiKey = generateApiKey();

  const hashedApiKey = hashApiKey(rawApiKey);

  const now = new Date();

  const device = await Device.create({
    deviceId: finalDeviceId,

    hostname: finalHostname,

    os: finalOs,

    userId: ownerId,

    apiKey: hashedApiKey,

    agentVersion,

    status: "online",

    lastSeen: now,

    heartbeatAt: now,

    ipAddress: ipAddress || req?.ip || "",

    localIp: localIp || "",

    metadata,
  });

  emitDeviceOnline(
    io,
    {
      deviceId: device.deviceId,
      hostname: device.hostname,
      status: device.status,
      lastSeen: device.lastSeen,
    },
    ownerId,
  );

  return isDirectControllerCall
    ? apiResponse(
        res,
        201,
        true,
        {
          deviceId: device.deviceId,
          apiKey: rawApiKey,
          reconnect: false,
        },
        "Device registered",
      )
    : {
        device,
        rawApiKey,
        reconnect: false,
      };
};

/**
 * Service to handle heartbeat updates.
 */
export const heartbeatService = async ({ ownerId, deviceId, io }) => {
  const device = await Device.findOne({ deviceId, userId: ownerId });
  if (!device) return null;
  const now = new Date();
  device.status = "online";
  device.lastSeen = now;
  device.heartbeatAt = now;
  await device.save();

  emitDeviceOnline(
    io,
    {
      deviceId: device.deviceId,
      hostname: device.hostname,
      status: device.status,
      lastSeen: device.lastSeen,
    },
    ownerId,
  );

  return device;
};

/**
 * Service to fetch user's devices.
 */
export const getDevicesService = async (ownerId) => {
  const devices = await Device.find({ userId: ownerId })
    .sort({ updatedAt: -1 })
    .select("-apiKey");
  return devices;
};

/**
 * Service to get a single device by ID.
 */
export const getDeviceByIdService = async (ownerId, deviceId) => {
  const device = await Device.findOne({ deviceId, userId: ownerId }).select(
    "-apiKey",
  );
  return device;
};

/**
 * Service to update a device.
 */
export const updateDeviceService = async ({
  ownerId,
  deviceId,
  payload,
  io,
}) => {
  const device = await Device.findOne({ deviceId, userId: ownerId });
  if (!device) return null;
  const { hostname, os, status, ipAddress, localIp, agentVersion, metadata } =
    payload;
  if (hostname !== undefined) device.hostname = hostname;
  if (os !== undefined) device.os = mapOS(os);
  if (status !== undefined) device.status = status;
  if (ipAddress !== undefined) device.ipAddress = ipAddress;
  if (localIp !== undefined) device.localIp = localIp;
  if (agentVersion !== undefined) device.agentVersion = agentVersion;
  if (metadata !== undefined)
    device.metadata = { ...device.metadata, ...metadata };
  await device.save();
  // emit realtime update
  emitDeviceOnline(
    io,
    {
      deviceId: device.deviceId,
      hostname: device.hostname,
      status: device.status,
      lastSeen: device.lastSeen,
    },
    ownerId,
  ); 
  return device;
};
