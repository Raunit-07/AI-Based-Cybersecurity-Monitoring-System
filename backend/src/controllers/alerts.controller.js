import mongoose from "mongoose";
import { getAlerts as getAlertsService } from "../services/alerts.service.js";
import catchAsync from "../utils/catchAsync.js";
import apiResponse from "../utils/apiResponse.js";

// ================= GET ALERTS =================
const getAlerts = catchAsync(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
  const skip = parseInt(req.query.skip, 10) || 0;

  const { alerts, total } = await getAlertsService({}, { limit, skip });

  // format for frontend
  const formattedAlerts = alerts.map((a) => ({
    id: a._id,
    type: a.type || "unknown",
    severity: a.severity || "low",
    source: a.ip || "system",
    time: a.createdAt?.toISOString() || new Date().toISOString(),
    status: "active",
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
  const { alerts } = await getAlertsService({}, { limit: 50, skip: 0 });

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

// ================= GET SUSPICIOUS IPS =================
const getSuspiciousIPs = catchAsync(async (req, res) => {
  const alerts = await mongoose.model("Alert").find().select("ip severity").lean();
  
  // Extract unique IPs and count alerts per IP
  const ipMap = {};
  alerts.forEach(a => {
    if (!ipMap[a.ip]) {
      ipMap[a.ip] = {
        ip: a.ip,
        count: 0,
        severity: "low",
        lastSeen: new Date()
      };
    }
    ipMap[a.ip].count++;
    if (a.severity === "critical") ipMap[a.ip].severity = "critical";
    else if (a.severity === "high" && ipMap[a.ip].severity !== "critical") ipMap[a.ip].severity = "high";
  });

  const ips = Object.values(ipMap).map(ip => ({
    ...ip,
    status: ip.severity === "critical" ? "blocked" : "flagged"
  }));

  apiResponse(
    res,
    200,
    true,
    { ips },
    "Suspicious IPs fetched successfully"
  );
});

export default {
  getAlerts,
  getAlertsLegacy,
  getSuspiciousIPs,
};