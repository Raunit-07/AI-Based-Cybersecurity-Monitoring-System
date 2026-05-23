import Device from "../models/device.model.js";
import apiResponse from "../utils/apiResponse.js";
import { emitDeviceOnline } from "../services/realtime.service.js";

/**
 * Service to create a new device registration.
 * Returns the device document and the raw apiKey.
 */
export const registerDeviceService = async ({ ownerId, payload, io, req }) => {
  const { deviceId, hostname, os, agentVersion, localIp, metadata } = payload;

  // Check existing device
  const existingDevice = await Device.findOne({ deviceId, userId: ownerId });
  if (existingDevice) {
    const now = new Date();
    existingDevice.lastSeen = now;
    existingDevice.heartbeatAt = now;
    existingDevice.status = "online";
    existingDevice.hostname = hostname;
    existingDevice.os = os;
    existingDevice.agentVersion = agentVersion || existingDevice.agentVersion;
    existingDevice.localIp = localIp || existingDevice.localIp;
    existingDevice.ipAddress = req.ip;
    existingDevice.metadata = { ...existingDevice.metadata, ...(metadata || {}) };
    await existingDevice.save();

    emitDeviceOnline(io, {
      deviceId: existingDevice.deviceId,
      hostname: existingDevice.hostname,
      status: existingDevice.status,
      lastSeen: existingDevice.lastSeen,
    }, ownerId);

    return { device: existingDevice, rawApiKey: null, reconnect: true };
  }

  // New device flow
  const { generateApiKey, hashApiKey } = await import("../utils/deviceKey.util.js");
  const rawApiKey = generateApiKey();
  const hashedApiKey = hashApiKey(rawApiKey);
  const now = new Date();

  const device = await Device.create({
    deviceId,
    hostname,
    os,
    userId: ownerId,
    apiKey: hashedApiKey,
    agentVersion: agentVersion || "1.0.0",
    status: "online",
    lastSeen: now,
    heartbeatAt: now,
    ipAddress: req.ip,
    localIp: localIp || "",
    metadata: {
      architecture: metadata?.architecture || "",
      platform: metadata?.platform || "",
      cpuUsage: metadata?.cpuUsage || 0,
      memoryUsage: metadata?.memoryUsage || 0,
    },
  });

  emitDeviceOnline(io, {
    deviceId: device.deviceId,
    hostname: device.hostname,
    status: device.status,
    lastSeen: device.lastSeen,
  }, ownerId);

  return { device, rawApiKey, reconnect: false };
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

  emitDeviceOnline(io, {
    deviceId: device.deviceId,
    hostname: device.hostname,
    status: device.status,
    lastSeen: device.lastSeen,
  }, ownerId);

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
  const device = await Device.findOne({ deviceId, userId: ownerId }).select("-apiKey");
  return device;
};

/**
 * Service to update a device.
 */
export const updateDeviceService = async ({ ownerId, deviceId, payload, io }) => {
  const device = await Device.findOne({ deviceId, userId: ownerId });
  if (!device) return null;
  const { hostname, os, status, ipAddress, localIp, agentVersion, metadata } = payload;
  if (hostname !== undefined) device.hostname = hostname;
  if (os !== undefined) device.os = os;
  if (status !== undefined) device.status = status;
  if (ipAddress !== undefined) device.ipAddress = ipAddress;
  if (localIp !== undefined) device.localIp = localIp;
  if (agentVersion !== undefined) device.agentVersion = agentVersion;
  if (metadata !== undefined) device.metadata = { ...device.metadata, ...metadata };
  await device.save();
  // emit realtime update
  emitDeviceOnline(io, {
    deviceId: device.deviceId,
    hostname: device.hostname,
    status: device.status,
    lastSeen: device.lastSeen,
  }, ownerId);
  return device;
};
