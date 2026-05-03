import logsService from "../services/logs.service.js";
import catchAsync from "../utils/catchAsync.js";
import apiResponse from "../utils/apiResponse.js";

// ================= CREATE / INGEST LOG =================
const createLog = catchAsync(async (req, res) => {
  const logData = req.body;

  // ✅ Validation
  if (!logData || !logData.ip) {
    return apiResponse(res, 400, false, null, "Invalid log data");
  }

  const io = req.app.get("io");

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
  const logs = await logsService.getLogs?.() || [];

  return apiResponse(res, 200, true, logs, "Logs fetched successfully");
});

// ✅ NAMED EXPORTS (IMPORTANT)
export { createLog, getLogs };