import Device from "../models/device.model.js";
import { getRedisConnection } from "../config/redis.js";
import { emitDeviceOnline } from "./realtime.service.js";
import { createAlert } from "./alerts.service.js";
import logger from "../utils/logger.js";

/**
 * Process telemetry data asynchronously (called by worker)
 */
export const processTelemetry = async (jobData, io) => {
  const { deviceId, userId, systemInfo, processes, timestamp } = jobData;

  try {
    // 1. Find device and update
    const device = await Device.findOne({ deviceId, userId });
    if (!device) {
      logger.warn(`Device not found for telemetry processing: deviceId=${deviceId}, userId=${userId}`);
      return;
    }

    const now = new Date();
    device.status = "online";
    device.lastSeen = now;
    device.heartbeatAt = now;
    device.localIp = systemInfo.localIp || device.localIp || "";
    device.metadata = {
      ...device.metadata,
      architecture: systemInfo.architecture || device.metadata?.architecture || "",
      platform: systemInfo.platform || device.metadata?.platform || "",
      cpuUsage: systemInfo.cpuUsage || 0,
      memoryUsage: systemInfo.memoryUsage || 0,
      systemInfo: systemInfo // Store full systemInfo for frontend compatibility
    };

    await device.save();

    // 2. Broadcast via Socket.IO
    // Emit standard device online event
    emitDeviceOnline(io, {
      deviceId: device.deviceId,
      hostname: device.hostname,
      status: device.status,
      os: device.os,
      lastSeen: device.lastSeen,
    }, userId);

    // Emit live telemetry event
    const telemetryPoint = {
      deviceId,
      hostname: device.hostname,
      systemInfo,
      processes: processes || [],
      timestamp: timestamp || now.toISOString()
    };

    if (io) {
      io.to(userId.toString()).emit("telemetry_live", telemetryPoint);
    }

    // 3. Store in Redis for live endpoint
    const redis = getRedisConnection();
    if (redis) {
      const listKey = `telemetry:live:${userId}`;
      await redis.lpush(listKey, JSON.stringify(telemetryPoint));
      await redis.ltrim(listKey, 0, 99);
    }

    // 4. Auto Alert Generation on Thresholds (> 90%)
    if (systemInfo.cpuUsage > 90) {
      await createAlert({
        deviceId,
        ip: systemInfo.localIp || "127.0.0.1",
        anomalyScore: 0.9,
        attackType: "Suspicious",
        severity: "high",
        message: `High CPU utilization detected on device ${device.hostname || deviceId}: ${systemInfo.cpuUsage}%`,
        source: "agent",
        meta: {
          requests: 0,
          failedLogins: 0,
          blocked: false
        }
      }, io, userId);
    }

    if (systemInfo.memoryUsage > 90) {
      await createAlert({
        deviceId,
        ip: systemInfo.localIp || "127.0.0.1",
        anomalyScore: 0.9,
        attackType: "Suspicious",
        severity: "high",
        message: `High Memory utilization detected on device ${device.hostname || deviceId}: ${systemInfo.memoryUsage}%`,
        source: "agent",
        meta: {
          requests: 0,
          failedLogins: 0,
          blocked: false
        }
      }, io, userId);
    }

    logger.info(`Telemetry processed for device: ${deviceId}`);
  } catch (error) {
    logger.error(`Error in processTelemetry service: ${error.message}`);
    throw error;
  }
};

/**
 * Fetch live telemetry points from Redis
 */
export const getLiveTelemetry = async (userId) => {
  const redis = getRedisConnection();
  if (!redis) return [];

  const listKey = `telemetry:live:${userId}`;
  const items = await redis.lrange(listKey, 0, 49);
  return items.map(item => JSON.parse(item));
};

/**
 * Fetch telemetry statistics/aggregate
 */
export const getTelemetryStats = async (userId) => {
  const devices = await Device.find({ userId });
  if (!devices || devices.length === 0) {
    return {
      totalDevices: 0,
      onlineDevices: 0,
      avgCpuUsage: 0,
      avgMemoryUsage: 0,
      maxCpuUsage: 0,
      maxMemoryUsage: 0,
    };
  }

  const onlineDevicesList = devices.filter(d => d.status === "online");
  const cpuUsages = onlineDevicesList.map(d => d.metadata?.cpuUsage || 0);
  const memoryUsages = onlineDevicesList.map(d => d.metadata?.memoryUsage || 0);

  const avgCpuUsage = cpuUsages.length ? (cpuUsages.reduce((a, b) => a + b, 0) / cpuUsages.length) : 0;
  const avgMemoryUsage = memoryUsages.length ? (memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length) : 0;

  return {
    totalDevices: devices.length,
    onlineDevices: onlineDevicesList.length,
    avgCpuUsage: Math.round(avgCpuUsage * 100) / 100,
    avgMemoryUsage: Math.round(avgMemoryUsage * 100) / 100,
    maxCpuUsage: cpuUsages.length ? Math.max(...cpuUsages) : 0,
    maxMemoryUsage: memoryUsages.length ? Math.max(...memoryUsages) : 0,
  };
};
