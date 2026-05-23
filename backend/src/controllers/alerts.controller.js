import mongoose from "mongoose";
import Alert from "../models/alert.model.js";

import apiResponse from "../utils/apiResponse.js";
import catchAsync from "../utils/catchAsync.js";

import {
  validateCreateAlert,
  validateUpdateStatus,
} from "../validators/alert.validator.js";

import {
  createAlert as createAlertService,
  updateAlertStatus as updateAlertStatusService,
} from "../services/alerts.service.js";

// ================= GET ALERTS =================
const getAlerts = catchAsync(async (req, res) => {
  if (!req.user?.id) {
    return apiResponse(res, 401, false, null, "Unauthorized");
  }

  const limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 100);
  const skip = Math.max(parseInt(req.query.skip) || 0, 0);

  const query = {
    user: req.user._id,
  };

  if (req.query.ip) query.ip = req.query.ip;
  if (req.query.severity) query.severity = req.query.severity;
  if (req.query.status) query.status = req.query.status;

  const alerts = await Alert.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Alert.countDocuments(query);

  return apiResponse(
    res,
    200,
    true,
    {
      alerts,
      total,
      limit,
      skip,
    },
    "Alerts fetched successfully",
  );
});

// ================= CREATE ALERT =================
const createAlert = catchAsync(async (req, res) => {
  if (!req.user?.id) {
    return apiResponse(res, 401, false, null, "Unauthorized");
  }

  const errors = validateCreateAlert(req.body);

  if (errors.length) {
    return apiResponse(res, 400, false, null, errors.join(", "));
  }

  const io = req.app.get("io");

  const alert = await createAlertService(req.body, io, req.user._id);

  return apiResponse(res, 201, true, alert, "Alert created successfully");
});

// ================= GET ALERT BY ID =================
const getAlertById = catchAsync(async (req, res) => {
  if (!req.user?.id) {
    return apiResponse(res, 401, false, null, "Unauthorized");
  }

  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return apiResponse(res, 400, false, null, "Invalid alert ID");
  }

  const alert = await Alert.findOne({
    _id: id,
    user: req.user._id,
  });

  if (!alert) {
    return apiResponse(res, 404, false, null, "Alert not found");
  }

  return apiResponse(res, 200, true, alert, "Alert fetched successfully");
});

// ================= UPDATE ALERT STATUS =================
const updateAlertStatus = catchAsync(async (req, res) => {
  if (!req.user?.id) {
    return apiResponse(res, 401, false, null, "Unauthorized");
  }

  const { id } = req.params;
  const { status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return apiResponse(res, 400, false, null, "Invalid alert ID");
  }

  const errors = validateUpdateStatus(status);

  if (errors.length) {
    return apiResponse(res, 400, false, null, errors.join(", "));
  }

  const alert = await updateAlertStatusService(req.user._id, id, status);

  if (!alert) {
    return apiResponse(res, 404, false, null, "Alert not found");
  }

  return apiResponse(
    res,
    200,
    true,
    alert,
    "Alert status updated successfully",
  );
});

// ================= THREAT TIMELINE =================
const getThreatTimeline = catchAsync(async (req, res) => {
  const timeline = await Alert.find({
    user: req.user._id,
  })
    .sort({ createdAt: -1 })
    .limit(50);

  return apiResponse(
    res,
    200,
    true,
    timeline,
    "Threat timeline fetched successfully",
  );
});

// ================= RESOLVE ALERT =================
const resolveAlert = catchAsync(async (req, res) => {
  const alert = await Alert.findOneAndUpdate(
    {
      _id: req.params.id,
      user: req.user._id,
    },
    {
      resolved: true,
      status: "resolved",
    },
    {
      new: true,
    },
  );

  return apiResponse(res, 200, true, alert, "Alert resolved successfully");
});

// ================= SUSPICIOUS IPS =================
const getSuspiciousIPs = catchAsync(async (req, res) => {
  const ips = await Alert.distinct("ip", {
    user: req.user._id,
  });

  return apiResponse(
    res,
    200,
    true,
    ips,
    "Suspicious IPs fetched successfully",
  );
});

// ================= ALERT STATS =================
const getAlertStats = catchAsync(async (req, res) => {
  const userFilter = {
    user: req.user._id,
  };

  const [totalAlerts, activeAlerts, resolvedAlerts] = await Promise.all([
    Alert.countDocuments(userFilter),

    Alert.countDocuments({
      ...userFilter,
      resolved: false,
    }),

    Alert.countDocuments({
      ...userFilter,
      resolved: true,
    }),
  ]);

  return apiResponse(
    res,
    200,
    true,
    {
      totalAlerts,
      activeAlerts,
      resolvedAlerts,
    },
    "Alert statistics fetched successfully",
  );
});

// ================= EXPORT =================
export default {
  getAlerts,
  createAlert,
  getAlertById,
  updateAlertStatus,
  getThreatTimeline,
  resolveAlert,
  getSuspiciousIPs,
  getAlertStats,
};
