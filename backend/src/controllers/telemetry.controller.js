import apiResponse from "../utils/apiResponse.js";
import catchAsync from "../utils/catchAsync.js";
import { getTelemetryQueue } from "../jobs/telemetryQueue.js";
import * as telemetryService from "../services/telemetry.service.js";

/**
 * Ingest telemetry from an agent (protected by deviceAuthMiddleware)
 */
export const ingestTelemetry = catchAsync(async (req, res) => {
  const { systemInfo, processes, timestamp } = req.body;
  const device = req.device; // from deviceAuthMiddleware

  if (!device) {
    return apiResponse(res, 401, false, null, "Device authentication required");
  }

  if (!systemInfo) {
    return apiResponse(res, 400, false, null, "System info is required");
  }

  const queue = getTelemetryQueue();
  await queue.add("telemetry-job", {
    deviceId: device.deviceId,
    userId: device.userId,
    systemInfo,
    processes,
    timestamp: timestamp || new Date().toISOString()
  });

  return apiResponse(res, 202, true, null, "Telemetry accepted");
});

/**
 * Get live telemetry (protected by authMiddleware)
 */
export const getLive = catchAsync(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  if (!userId) {
    return apiResponse(res, 401, false, null, "Unauthorized");
  }

  const liveData = await telemetryService.getLiveTelemetry(userId);
  return apiResponse(res, 200, true, { telemetry: liveData }, "Live telemetry fetched");
});

/**
 * Get telemetry stats (protected by authMiddleware)
 */
export const getStats = catchAsync(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  if (!userId) {
    return apiResponse(res, 401, false, null, "Unauthorized");
  }

  const stats = await telemetryService.getTelemetryStats(userId);
  return apiResponse(res, 200, true, { stats }, "Telemetry stats fetched");
});
