import mongoose from "mongoose";

import Alert from "../models/alert.model.js";

import catchAsync from "../utils/catchAsync.js";
import apiResponse from "../utils/apiResponse.js";

// ================= GET ALERTS =================
const getAlerts = catchAsync(
  async (req, res) => {
    // ================= AUTH CHECK =================
    if (!req.user?._id) {
      return apiResponse(
        res,
        401,
        false,
        null,
        "Unauthorized"
      );
    }

    const limit = Math.min(
      Math.max(
        parseInt(req.query.limit) || 50,
        1
      ),
      100
    );

    const skip = Math.max(
      parseInt(req.query.skip) || 0,
      0
    );

    const ip = req.query.ip;
    const severity =
      req.query.severity;

    const status =
      req.query.status;

    // ================= USER FILTER =================
    const query = {
      user: req.user._id,
    };

    if (ip) query.ip = ip;

    if (severity) {
      query.severity = severity;
    }

    if (status) {
      query.status = status;
    }

    const alerts =
      await Alert.find(query)
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean();

    const total =
      await Alert.countDocuments(
        query
      );

    const formattedAlerts =
      alerts.map((a) => ({
        id: a._id.toString(),

        ip: a.ip,

        attackType:
          a.attackType,

        anomalyScore:
          a.anomalyScore,

        severity:
          a.severity ||
          getSeverity(
            a.anomalyScore
          ),

        status:
          a.status ||
          (a.resolved
            ? "resolved"
            : "active"),

        message:
          a.message ||
          "Threat activity detected",

        source:
          a.source ||
          "nginx",

        timestamp:
          a.timestamp ||
          a.createdAt,

        meta: a.meta || {},
      }));

    return apiResponse(
      res,
      200,
      true,
      {
        alerts:
          formattedAlerts,

        total,

        limit,

        skip,
      },
      "Alerts fetched successfully"
    );
  }
);

// ================= THREAT TIMELINE =================
const getThreatTimeline =
  catchAsync(
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

      const limit = Math.min(
        Math.max(
          parseInt(
            req.query.limit
          ) || 50,
          1
        ),
        200
      );

      const timeline =
        await Alert.find({
          user: req.user._id,
        })
          .sort({
            createdAt: -1,
          })
          .limit(limit)
          .lean();

      const formattedTimeline =
        timeline.map(
          (alert) => ({
            id:
              alert._id.toString(),

            timestamp:
              alert.timestamp ||
              alert.createdAt,

            attackType:
              alert.attackType,

            severity:
              alert.severity ||
              getSeverity(
                alert.anomalyScore
              ),

            ip: alert.ip,

            status:
              alert.status ||
              (alert.resolved
                ? "resolved"
                : "active"),

            message:
              alert.message ||
              `${alert.attackType} detected from ${alert.ip}`,

            source:
              alert.source ||
              "nginx",
          })
        );

      return apiResponse(
        res,
        200,
        true,
        {
          timeline:
            formattedTimeline,

          total:
            formattedTimeline.length,
        },
        "Threat timeline fetched successfully"
      );
    }
  );

// ================= RESOLVE ALERT =================
const resolveAlert =
  catchAsync(
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

      const { id } =
        req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return apiResponse(
          res,
          400,
          false,
          null,
          "Invalid alert ID"
        );
      }

      // ================= USER OWNERSHIP =================
      const alert =
        await Alert.findOneAndUpdate(
          {
            _id: id,

            user:
              req.user._id,
          },
          {
            resolved: true,

            status:
              "resolved",
          },
          {
            new: true,
          }
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

          status:
            alert.status,
        },
        "Alert resolved successfully"
      );
    }
  );

// ================= SUSPICIOUS IPs =================
const getSuspiciousIPs =
  catchAsync(
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

      const limit = Math.min(
        parseInt(
          req.query.limit
        ) || 20,
        50
      );

      const suspiciousIPs =
        await Alert.aggregate([
          // ================= USER FILTER =================
          {
            $match: {
              user:
                req.user._id,

              ip: {
                $ne: null,
              },
            },
          },

          {
            $group: {
              _id: "$ip",

              attackCount: {
                $sum: 1,
              },

              avgAnomalyScore:
              {
                $avg:
                  "$anomalyScore",
              },

              maxAnomalyScore:
              {
                $min:
                  "$anomalyScore",
              },

              latestAttack:
              {
                $max:
                  "$createdAt",
              },

              attackTypes: {
                $addToSet:
                  "$attackType",
              },
            },
          },

          {
            $project: {
              _id: 0,

              ip: "$_id",

              attackCount: 1,

              avgAnomalyScore:
              {
                $round: [
                  "$avgAnomalyScore",
                  3,
                ],
              },

              latestAttack: 1,

              attackTypes: 1,

              threatScore: {
                $multiply: [
                  "$attackCount",
                  10,
                ],
              },

              severity: {
                $switch: {
                  branches: [
                    {
                      case: {
                        $gte: [
                          "$attackCount",
                          15,
                        ],
                      },

                      then:
                        "critical",
                    },

                    {
                      case: {
                        $gte: [
                          "$attackCount",
                          8,
                        ],
                      },

                      then:
                        "high",
                    },

                    {
                      case: {
                        $gte: [
                          "$attackCount",
                          3,
                        ],
                      },

                      then:
                        "medium",
                    },
                  ],

                  default:
                    "low",
                },
              },

              status: {
                $cond: [
                  {
                    $lte: [
                      "$maxAnomalyScore",
                      -0.7,
                    ],
                  },

                  "blocked",

                  "flagged",
                ],
              },
            },
          },

          {
            $sort: {
              threatScore:
                -1,
            },
          },

          {
            $limit: limit,
          },
        ]);

      return apiResponse(
        res,
        200,
        true,
        {
          ips:
            suspiciousIPs,

          total:
            suspiciousIPs.length,
        },
        "Suspicious IPs fetched successfully"
      );
    }
  );

// ================= ALERT STATS =================
const getAlertStats =
  catchAsync(
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

      const userFilter = {
        user: req.user._id,
      };

      const [
        totalAlerts,
        activeAlerts,
        criticalAlerts,
        resolvedAlerts,
        suspiciousIPs,
      ] = await Promise.all([
        Alert.countDocuments(
          userFilter
        ),

        Alert.countDocuments({
          ...userFilter,

          resolved: false,
        }),

        Alert.countDocuments({
          ...userFilter,

          severity:
            "critical",
        }),

        Alert.countDocuments({
          ...userFilter,

          resolved: true,
        }),

        Alert.distinct(
          "ip",
          userFilter
        ),
      ]);

      return apiResponse(
        res,
        200,
        true,
        {
          totalAlerts,

          activeAlerts,

          criticalAlerts,

          resolvedAlerts,

          suspiciousIPCount:
            suspiciousIPs.length,
        },
        "Alert statistics fetched successfully"
      );
    }
  );

// ================= UTILITY =================
const getSeverity = (
  score = 0
) => {
  if (score < -0.7)
    return "critical";

  if (score < -0.5)
    return "high";

  if (score < -0.3)
    return "medium";

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