import logsService from "../services/logs.service.js";
import apiResponse from "../utils/apiResponse.js";
import catchAsync from "../utils/catchAsync.js";
import logger from "../utils/logger.js";

// const logQueue = getLogQueue();

/*
==================================================
CREATE / INGEST LOGS
Queue-based processing
==================================================
*/

const createLog = catchAsync(async (req, res) => {
  const userId = req.systemUser?._id || req.user?._id || null;

  const logs = Array.isArray(req.logs)
    ? req.logs
    : Array.isArray(req.body.logs)
      ? req.body.logs
      : [req.body];

  if (!logs?.length) {
    return apiResponse(res, 400, false, null, "No logs provided");
  }

  const jobs = [];

  for (const logData of logs) {
    try {
      if (!logData?.ip) {
        logger.warn("Skipped invalid log: missing IP");
        continue;
      }

      const processedLogData = {
        ip: String(logData.ip).trim(),

        endpoint: logData.endpoint || "/",

        method: String(logData.method || "GET").toUpperCase(),

        requests: Number(logData.requests ?? 1),

        failedLogins: Number(logData.failedLogins ?? 0),

        statusCode: Number(logData.statusCode ?? 200),

        bytes: Number(logData.bytes ?? 0),

        user_agent: logData.user_agent || "Unknown",

        referrer: logData.referrer || "-",

        timestamp: logData.timestamp ? new Date(logData.timestamp) : new Date(),

        user: userId,
      };

      jobs.push({
        name: "process-log",

        data: processedLogData,

        opts: {
          attempts: 3,

          backoff: {
            type: "exponential",
            delay: 3000,
          },

          removeOnComplete: 100,

          removeOnFail: 50,

          jobId: `${processedLogData.ip}-${Date.now()}-${Math.random()}`,
        },
      });
    } catch (err) {
      logger.error("Queue preparation failed", {
        error: err.message,
        stack: err.stack,
      });
    }
  }

  if (jobs.length === 0) {
    return apiResponse(res, 400, false, null, "No valid logs to process");
  }

  const logQueue = getLogQueue();

  await logQueue.addBulk(jobs);

  logger.info(`${jobs.length} logs queued`, {
    queued: jobs.length,
    received: logs.length,
  });

  return apiResponse(
    res,
    202,
    true,
    {
      queued: jobs.length,
      received: logs.length,
    },
    "Logs queued successfully",
  );
});

/*
==================================================
GET LOGS
==================================================
*/

const getLogs = catchAsync(async (req, res) => {
  if (!req.user?._id) {
    return apiResponse(res, 401, false, null, "Unauthorized");
  }

  const logs = await logsService.getLogs(req.user._id, req.query);

  return apiResponse(res, 200, true, logs, "Logs fetched successfully");
});

export { createLog, getLogs };
