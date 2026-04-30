import alertsService from "../services/alerts.service.js";
import catchAsync from "../utils/catchAsync.js";
import apiResponse from "../utils/apiResponse.js";

// ================= GET ALERTS =================
const getAlerts = catchAsync(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
  const skip = parseInt(req.query.skip, 10) || 0;

  const { alerts, total } = await alertsService.getAlerts({}, { limit, skip });

  // ✅ SAFE FORMAT (frontend compatible)
  const formattedAlerts = alerts.map((a) => ({
    id: a._id,
    type: a.type || "unknown",
    severity: a.severity || "low",
    source: a.ip || "system", // 🔥 FIX: use ip instead of missing field
    time: a.createdAt?.toISOString() || new Date().toISOString(),
    status: "active", // 🔥 FIX: your DB has no status → force active
  }));

  apiResponse(
    res,
    200,
    true,
    { alerts: formattedAlerts, total, limit, skip },
    "Alerts fetched successfully"
  );
});

// ================= LEGACY ROUTE =================
const getAlertsLegacy = catchAsync(async (req, res) => {
  const { alerts } = await alertsService.getAlerts({}, { limit: 50, skip: 0 });

  const formattedAlerts = alerts.map((a) => ({
    id: a._id,
    type: a.type || "unknown",
    severity: a.severity || "low",
    source: a.ip || "system",
    time: a.createdAt?.toISOString() || new Date().toISOString(),
    status: "active",
  }));

  res.json(formattedAlerts);
});

export default {
  getAlerts,
  getAlertsLegacy,
};