import mongoose from "mongoose";
import Alert from "../models/alert.model.js";
import catchAsync from "../utils/catchAsync.js";
import apiResponse from "../utils/apiResponse.js";

// ================= GET ALERTS =================
const getAlerts = catchAsync(async (req, res) => {
  const limit = Math.min(
    Math.max(parseInt(req.query.limit) || 50, 1),
    100
  );

  const skip = Math.max(parseInt(req.query.skip) || 0, 0);

  const ip = req.query.ip;
  const severity = req.query.severity;
  const status = req.query.status;

  const query = {};

  if (ip) query.ip = ip;
  if (severity) query.severity = severity;
  if (status) query.status = status;

  const alerts = await Alert.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Alert.countDocuments(query);

  const formattedAlerts = alerts.map((a) => ({
    id: a._id.toString(),

    ip: a.ip,

    attackType: a.attackType,

    anomalyScore: a.anomalyScore,

    severity:
      a.severity || getSeverity(a.anomalyScore),

    status:
      a.status || (a.resolved ? "resolved" : "active"),

    message:
      a.message || "Threat activity detected",

    source: a.source || "nginx",

    timestamp: a.timestamp || a.createdAt,

    meta: a.meta || {},
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

// ================= THREAT TIMELINE =================
const getThreatTimeline = catchAsync(async (req, res) => {
  const limit = Math.min(
    Math.max(parseInt(req.query.limit) || 50, 1),
    200
  );

  const timeline = await Alert.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  const formattedTimeline = timeline.map((alert) => ({
    id: alert._id.toString(),

    timestamp:
      alert.timestamp || alert.createdAt,

    attackType: alert.attackType,

    severity:
      alert.severity ||
      getSeverity(alert.anomalyScore),

    ip: alert.ip,

    status:
      alert.status ||
      (alert.resolved ? "resolved" : "active"),

    message:
      alert.message ||
      `${alert.attackType} detected from ${alert.ip}`,

    source: alert.source || "nginx",
  }));

  return apiResponse(
    res,
    200,
    true,
    {
      timeline: formattedTimeline,
      total: formattedTimeline.length,
    },
    "Threat timeline fetched successfully"
  );
});

// ================= RESOLVE ALERT =================
const resolveAlert = catchAsync(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return apiResponse(
      res,
      400,
      false,
      null,
      "Invalid alert ID"
    );
  }

  const alert = await Alert.findByIdAndUpdate(
    id,
    {
      resolved: true,
      status: "resolved",
    },
    { new: true }
  );

  if (!alert) {
    return apiResponse(
      res,
      404,
      false,
      null,
      "Alert not found"
    );
  }

  return apiResponse(
    res,
    200,
    true,
    {
      id: alert._id,
      status: alert.status,
    },
    "Alert resolved successfully"
  );
});

// ================= SUSPICIOUS IPs =================
const getSuspiciousIPs = catchAsync(async (req, res) => {
  const limit = Math.min(
    parseInt(req.query.limit) || 20,
    50
  );

  const pipeline = [
    {
      $group: {
        _id: "$ip",

        attackCount: { $sum: 1 },

        maxScore: {
          $max: "$anomalyScore",
        },

        lastSeen: {
          $max: "$createdAt",
        },

        attackTypes: {
          $addToSet: "$attackType",
        },
      },
    },

    {
      $sort: {
        attackCount: -1,
      },
    },

    {
      $limit: limit,
    },
  ];

  const results = await Alert.aggregate(pipeline);

  const ips = results.map((r) => ({
    ip: r._id,

    attackCount: r.attackCount,

    severity: getSeverity(r.maxScore),

    lastSeen: r.lastSeen,

    attackTypes: r.attackTypes,

    status:
      r.maxScore < -0.7
        ? "blocked"
        : "flagged",
  }));

  return apiResponse(
    res,
    200,
    true,
    { ips },
    "Suspicious IPs fetched successfully"
  );
});

// ================= ALERT STATS =================
const getAlertStats = catchAsync(async (req, res) => {
  const totalAlerts =
    await Alert.countDocuments();

  const activeAlerts =
    await Alert.countDocuments({
      resolved: false,
    });

  const criticalAlerts =
    await Alert.countDocuments({
      severity: "critical",
    });

  const resolvedAlerts =
    await Alert.countDocuments({
      resolved: true,
    });

  return apiResponse(
    res,
    200,
    true,
    {
      totalAlerts,
      activeAlerts,
      criticalAlerts,
      resolvedAlerts,
    },
    "Alert statistics fetched successfully"
  );
});

// ================= UTILITY =================
const getSeverity = (score = 0) => {
  if (score < -0.7) return "critical";

  if (score < -0.5) return "high";

  if (score < -0.3) return "medium";

  return "low";
};

// ================= EXPORT =================
export default {
  getAlerts,
  getThreatTimeline,
  resolveAlert,
  getSuspiciousIPs,
  getAlertStats,
};