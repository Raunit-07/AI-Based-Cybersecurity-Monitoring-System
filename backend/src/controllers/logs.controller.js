import logsService from "../services/logs.service.js";

import catchAsync from "../utils/catchAsync.js";
import apiResponse from "../utils/apiResponse.js";

// ================= CREATE / INGEST LOG =================
const createLog = catchAsync(
  async (req, res) => {
    const logData = req.body;

    // ================= VALIDATION =================
    if (
      !logData ||
      !logData.ip
    ) {
      return apiResponse(
        res,
        400,
        false,
        null,
        "Invalid log data"
      );
    }

    // ================= AUTHENTICATED SYSTEM USER =================
    if (!req.systemUser) {
      return apiResponse(
        res,
        401,
        false,
        null,
        "Unauthorized system"
      );
    }

    // ================= SOCKET.IO =================
    const io =
      req.io ||
      req.app.get("io");

    // ================= ATTACH USER =================
    const processedLogData = {
      ...logData,

      // ✅ ALERT OWNER
      user:
        req.systemUser._id,
    };

    // ================= PROCESS LOG =================
    const result =
      await logsService.processLog(
        processedLogData,
        io
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

// ================= GET LOGS =================
const getLogs = catchAsync(
  async (req, res) => {
    let logs = [];

    try {
      if (
        logsService.getLogs
      ) {
        logs =
          await logsService.getLogs(
            {
              user:
                req.user?._id,
            }
          );
      }
    } catch (error) {
      console.error(
        "❌ Fetch logs error:",
        error.message
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

// ================= EXPORT =================
export {
  createLog,
  getLogs,
};