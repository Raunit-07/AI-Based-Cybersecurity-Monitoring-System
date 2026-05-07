import logsService from "../services/logs.service.js";

import catchAsync from "../utils/catchAsync.js";

import apiResponse from "../utils/apiResponse.js";

import logger from "../utils/logger.js";

/**
 * ================= CREATE / INGEST LOG =================
 * Multi-user SaaS safe
 */
const createLog = catchAsync(
  async (req, res) => {
    const logData = req.body;

    /**
     * ================= VALIDATION =================
     */
    if (!logData || !logData.ip) {
      return apiResponse(
        res,
        400,
        false,
        null,
        "Invalid log data"
      );
    }

    /**
     * ================= AUTHENTICATED SYSTEM USER =================
     */
    if (!req.systemUser?._id) {
      return apiResponse(
        res,
        401,
        false,
        null,
        "Unauthorized system"
      );
    }

    /**
     * ================= SOCKET.IO =================
     */
    const io =
      req.io ||
      req.app.get("io");

    /**
     * ================= USER ID =================
     */
    const userId =
      req.systemUser._id;

    /**
     * ================= ATTACH USER =================
     */
    const processedLogData = {
      ...logData,

      // ✅ Tenant ownership
      user: userId,
    };

    /**
     * ================= PROCESS LOG =================
     * IMPORTANT:
     * pass userId for tenant isolation
     */
    const result =
      await logsService.processLog(
        processedLogData,
        io,
        userId
      );

    logger.info(
      `✅ Log ingested for user: ${userId}`
    );

    return apiResponse(
      res,
      201,
      true,
      {
        log: result.log,

        ml: result.mlResult,

        alert:
          result.alert || null,
      },
      "Log processed successfully"
    );
  }
);

/**
 * ================= GET LOGS =================
 * User-isolated logs
 */
const getLogs = catchAsync(
  async (req, res) => {
    if (!req.user?._id) {
      return apiResponse(
        res,
        401,
        false,
        null,
        "Unauthorized"
      );
    }

    let logs = [];

    try {
      if (
        typeof logsService.getLogs ===
        "function"
      ) {
        logs =
          await logsService.getLogs({
            user:
              req.user._id,
          });
      }
    } catch (error) {
      logger.error(
        `❌ Fetch logs error: ${error.message}`
      );
    }

    return apiResponse(
      res,
      200,
      true,
      logs,
      "Logs fetched successfully"
    );
  }
);

/**
 * ================= EXPORT =================
 */
export {
  createLog,
  getLogs,
};