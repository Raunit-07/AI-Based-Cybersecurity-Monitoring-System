import logsService from "../services/logs.service.js";
import catchAsync from "../utils/catchAsync.js";
import apiResponse from "../utils/apiResponse.js";

// ================= INGEST LOG =================
const ingestLog = catchAsync(async (req, res) => {
  const logData = req.body;

  // ✅ Basic validation safeguard
  if (!logData.ip || typeof logData.requests === "undefined") {
    return apiResponse(res, 400, false, null, "Invalid log data");
  }

  const io = req.app.get("io");

  // ✅ Use service (IMPORTANT - single source of truth)
  const result = await logsService.processLog(logData, io);

  return apiResponse(
    res,
    201,
    true,
    {
      log: result.log,
      alert: result.alert || null,
      ml: result.mlResult,
    },
    "Log processed successfully"
  );
});

// ================= GET LOGS =================
const getLogs = catchAsync(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
  const skip = parseInt(req.query.skip, 10) || 0;

  const { logs, total } = await logsService.getLogs({}, { limit, skip });

  apiResponse(
    res,
    200,
    true,
    { logs, total, limit, skip },
    "Logs fetched successfully"
  );
});

export default {
  ingestLog,
  getLogs,
};