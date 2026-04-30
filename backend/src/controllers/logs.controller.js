import logsService from "../services/logs.service.js";
import catchAsync from "../utils/catchAsync.js";
import apiResponse from "../utils/apiResponse.js";
import Log from "../models/log.model.js";
import axios from "axios";

// ================= INGEST LOG =================
const ingestLog = catchAsync(async (req, res) => {
  const logData = req.body;

  // ✅ Basic validation safeguard
  if (!logData.ip || typeof logData.requests === "undefined") {
    return apiResponse(res, 400, false, null, "Invalid log data");
  }

  // ✅ Save log
  const log = await Log.create(logData);

  // ================= ML DETECTION =================
  let mlResult = null;

  try {
    const response = await axios.post(process.env.ML_SERVICE_URL, {
      ip: log.ip,
      requests: log.requests,
      failedLogins: log.failedLogins || 0,
    });

    mlResult = response.data;
  } catch (error) {
    console.error("ML Service Error:", error.message);
  }

  // ================= ALERT =================
  if (mlResult && mlResult.is_anomaly) {
    const alert = {
      ip: log.ip,
      type: mlResult.attack_type || "suspicious",
      severity: "high",
      timestamp: new Date(),
    };

    const io = req.app.get("io");
    if (io) {
      io.emit("new-alert", alert);
    }
  }

  apiResponse(res, 201, true, { log }, "Log stored successfully");
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