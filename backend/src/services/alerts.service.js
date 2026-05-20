import Alert from "../models/alert.model.js";
import User from "../models/User.js";

import { sendSlackAlert } from "../integrations/slack.js";
import { sendEmailAlert } from "../integrations/email.js";

import validator from "validator";

import logger from "../utils/logger.js";

import {
  emitAlert
} from "./realtime.service.js";


/**
 * ============================================
 * NORMALIZE ATTACK TYPE
 * ============================================
 */
const normalizeAttackType = (type = "") => {

  const t = String(type)
    .toLowerCase()
    .trim();

  if (t.includes("ddos"))
    return "DDoS";

  if (
    t.includes("brute") ||
    t.includes("force")
  )
    return "Brute Force";

  if (
    t.includes("scan") ||
    t.includes("port")
  )
    return "Port Scan";

  if (
    t.includes("sql") ||
    t.includes("inject")
  )
    return "SQL Injection";

  if (
    t.includes("xss")
  )
    return "XSS";

  if (
    t.includes("malware")
  )
    return "Malware";

  if (
    t.includes("normal")
  )
    return "Normal";

  return "Suspicious";

};



/**
 * ============================================
 * NORMALIZE SCORE
 * 0 → normal
 * 1 → critical
 * ============================================
 */
const normalizeScore = (score) => {

  const value =
    Math.abs(
      Number(score) || 0
    );

  return Math.min(
    Math.max(value, 0),
    1
  );

};



/**
 * ============================================
 * SEVERITY
 * ============================================
 */
const getSeverity = (score) => {

  if (score >= 0.85)
    return "critical";

  if (score >= 0.65)
    return "high";

  if (score >= 0.40)
    return "medium";

  return "low";

};



/**
 * ============================================
 * CREATE ALERT
 * ============================================
 */
const createAlert =
  async (
    alertData = {},
    io = null,
    userId = null
  ) => {

    try {

      if (!userId) {

        throw new Error(
          "Missing alert owner"
        );

      }

      if (
        !alertData.ip ||
        !validator.isIP(
          String(
            alertData.ip
          )
        )
      ) {

        throw new Error(
          "Invalid IP"
        );

      }


      const ip =
        String(
          alertData.ip
        ).trim();

      const anomalyScore =
        normalizeScore(
          alertData.anomalyScore
        );

      const attackType =
        normalizeAttackType(
          alertData.attackType
        );

      const normalizedType =
        attackType
          .toLowerCase()
          .replace(
            /\s+/g,
            ""
          );

      const severity =

        alertData.severity ||

        getSeverity(
          anomalyScore
        );



      const alert =
        await Alert.create({

          user:
            userId,

          deviceId:
            alertData.deviceId ||
            null,

          ip,

          anomalyScore,

          threatScore:
            anomalyScore,

          attackType,

          type:
            normalizedType,

          severity,

          message:
            alertData.message ||
            `${attackType} threat detected`,

          source:
            alertData.source ||
            "nginx",

          meta: {

            requests:
              Number(
                alertData?.meta?.requests
              ) || 0,

            failedLogins:
              Number(
                alertData?.meta?.failedLogins
              ) || 0,

            blocked:
              Boolean(
                alertData?.meta?.blocked
              )

          },

          status:
            "active",

          resolved:
            false,

          timestamp:
            alertData.timestamp ||
            new Date()

        });



      /**
       * ============================================
       * REALTIME EVENT
       * ============================================
       */

      const payload = {

        id:
          alert._id,

        ip:
          alert.ip,

        deviceId:
          alert.deviceId,

        attackType:
          alert.attackType,

        severity:
          alert.severity,

        anomalyScore:
          alert.anomalyScore,

        message:
          alert.message,

        status:
          alert.status,

        timestamp:
          alert.timestamp,

        meta:
          alert.meta

      };

      emitAlert(

        io,

        userId,

        payload

      );



      /**
       * ============================================
       * INTEGRATIONS
       * ============================================
       */

      if (
        ["high", "critical"]
          .includes(
            alert.severity
          )
      ) {

        try {

          const user =
            await User.findById(
              userId
            )
              .lean();


          await Promise.allSettled([

            sendSlackAlert(
              alert
            ),

            sendEmailAlert({

              ...alert.toObject(),

              recipientEmail:
                user?.email

            })

          ]);

        }
        catch (error) {

          logger.error(
            `Integration error: ${error.message}`
          );

        }

      }



      logger.info(
        `Alert created: ${alert._id}`
      );


      return alert;

    }
    catch (error) {

      logger.error(
        `createAlert error: ${error.message}`
      );

      throw error;

    }

  };



/**
 * ============================================
 * GET ALERTS
 * ============================================
 */
const getAlerts =
  async (
    userId,
    query = {},
    options = {}
  ) => {

    const limit =
      Math.min(
        Number(
          options.limit
        ) || 50,
        100
      );

    const skip =
      Math.max(
        Number(
          options.skip
        ) || 0,
        0
      );

    const safeQuery = {

      ...query,

      user: userId,

      isDeleted: false

    };


    const alerts =
      await Alert.find(
        safeQuery
      )
        .sort({

          createdAt: -1

        })
        .skip(skip)
        .limit(limit)
        .lean();


    const total =
      await Alert.countDocuments(
        safeQuery
      );


    return {

      success: true,

      data: alerts,

      total

    };

  };



/**
 * ============================================
 * RESOLVE ALERT
 * ============================================
 */
const resolveAlert =
  async (
    alertId,
    userId
  ) => {

    const alert =
      await Alert.findOneAndUpdate(

        {

          _id:
            alertId,

          user:
            userId

        },

        {

          resolved: true,

          status: "resolved",

          resolvedAt:
            new Date()

        },

        {

          new: true

        }

      );

    return alert;

  };



export {

  createAlert,
  getAlerts,
  resolveAlert

};