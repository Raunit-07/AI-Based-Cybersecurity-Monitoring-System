import mongoose from "mongoose";
import Alert from "../models/alert.model.js";
import catchAsync from "../utils/catchAsync.js";
import apiResponse from "../utils/apiResponse.js";

// ================= GET ALERTS =================
const getAlerts = catchAsync(async (req, res) => {
  // ✅ Secure query parsing
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 100);
  const skip = Math.max(parseInt(req.query.skip) || 0, 0);
  const ip = req.query.ip;

  const query = {};
  if (ip) query.ip = ip;

  const alerts = await Alert.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Alert.countDocuments(query);

  // ✅ Standardized response mapping (IMPORTANT)
  const formattedAlerts = alerts.map((a) => ({
    id: a._id.toString(),
    ip: a.ip,
    attackType: a.attackType,
    anomalyScore: a.anomalyScore,
    severity: getSeverity(a.anomalyScore),
    status: a.resolved ? "resolved" : "active",
    timestamp: a.createdAt,
  }));

  return apiResponse(
    res,
    200,
    true,
    {
      alerts: formattedAlerts,
      total,
      limit,
      skip,
    },
    "Alerts fetched successfully"
  );
});

// ================= RESOLVE ALERT =================
const resolveAlert = catchAsync(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return apiResponse(res, 400, false, null, "Invalid alert ID");
  }

  const alert = await Alert.findByIdAndUpdate(
    id,
    { resolved: true },
    { new: true }
  );

  if (!alert) {
    return apiResponse(res, 404, false, null, "Alert not found");
  }

  return apiResponse(
    res,
    200,
    true,
    {
      id: alert._id,
      status: "resolved",
    },
    "Alert resolved successfully"
  );
});

// ================= SUSPICIOUS IPs =================
const getSuspiciousIPs = catchAsync(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);

  const pipeline = [
    {
      $group: {
        _id: "$ip",
        count: { $sum: 1 },
        maxScore: { $max: "$anomalyScore" },
        lastSeen: { $max: "$createdAt" },
      },
    },
    {
      $sort: { count: -1 },
    },
    {
      $limit: limit,
    },
  ];

  const results = await Alert.aggregate(pipeline);

  const ips = results.map((r) => ({
    ip: r._id,
    attackCount: r.count,
    severity: getSeverity(r.maxScore),
    lastSeen: r.lastSeen,
    status: r.maxScore < -0.7 ? "blocked" : "flagged",
  }));

  return apiResponse(
    res,
    200,
    true,
    { ips },
    "Suspicious IPs fetched successfully"
  );
});

// ================= UTILITY =================
const getSeverity = (score) => {
  if (score < -0.7) return "critical";
  if (score < -0.5) return "high";
  if (score < -0.3) return "medium";
  return "low";
};

export default {
  getAlerts,
  resolveAlert,
  getSuspiciousIPs,
};