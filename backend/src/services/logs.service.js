import Log from "../models/log.model.js";
import { createAlert } from "./alerts.service.js";
import { detectThreat } from "./mlClient.js";
import logger from "../utils/logger.js";
import { emitTrafficUpdate } from "./realtime.service.js";

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

  if (t.includes("xss"))
    return "XSS";

  if (
    t.includes("malware")
  )
    return "Malware";

  if (
    t.includes("suspicious")
  )
    return "Suspicious";

  return "Normal";
};



/**
 * ============================================
 * SANITIZE INPUT
 * ============================================
 */
const sanitizeLogData = (data = {}) => {

  return {

    ip:
      String(
        data.ip || ""
      ).trim(),

    requests:
      Math.max(
        0,
        Number(
          data.requests
        ) || 0
      ),

    failedLogins:
      Math.max(
        0,
        Number(
          data.failedLogins
        ) || 0
      ),

    endpoint:
      String(
        data.endpoint ||
        "/unknown"
      ),

    method:
      String(
        data.method ||
        "GET"
      ),

    timestamp:
      data.timestamp
        ?
        new Date(
          data.timestamp
        )
        :
        new Date(),

    user_agent:
      String(
        data.user_agent ||
        "unknown"
      )

  };

};



/**
 * ============================================
 * NORMALIZE SCORE
 * 0 → NORMAL
 * 1 → CRITICAL
 * ============================================
 */
const normalizeScore = (score) => {

  const value =
    Math.abs(
      Number(
        score
      ) || 0
    );

  return Math.min(
    Math.max(
      value,
      0
    ),
    1
  );

};



/**
 * ============================================
 * DETERMINE SEVERITY
 * ============================================
 */
const getSeverity = (
  data,
  score,
  attackType
) => {

  if (
    attackType === "DDoS" ||
    data.requests > 2000 ||
    score >= 0.85
  ) {

    return "critical";

  }

  if (
    attackType === "Brute Force" ||
    data.failedLogins > 20 ||
    score >= 0.65
  ) {

    return "high";

  }

  if (
    score >= 0.40
  ) {

    return "medium";

  }

  return "low";

};



/**
 * ============================================
 * MAIN LOG PROCESSING
 * ============================================
 */
const processLog =
  async (
    logData,
    io,
    userId
  ) => {

    try {

      if (
        !logData ||
        !logData.ip
      ) {

        throw new Error(
          "Invalid log data"
        );

      }

      if (
        !userId
      ) {

        throw new Error(
          "Missing user ID"
        );

      }


      const cleanData =
        sanitizeLogData(
          logData
        );



      /**
       * ============================================
       * DEFAULT ML RESULT
       * ============================================
       */
      let prediction = {

        is_anomaly: false,

        anomaly_score: 0,

        attackType: "normal"

      };



      /**
       * ============================================
       * ML SERVICE
       * ============================================
       */
      try {

        const mlResponse =
          await detectThreat({

            ip:
              cleanData.ip,

            requests:
              cleanData.requests,

            failedLogins:
              cleanData.failedLogins,

            method:
              cleanData.method,

            endpoint:
              cleanData.endpoint

          });


        prediction =
          mlResponse?.data ||
          mlResponse ||
          prediction;

      }
      catch (error) {

        logger.error(
          `ML error: ${error.message}`
        );

      }



      /**
       * ============================================
       * SCORE
       * ============================================
       */
      const anomalyScore =
        normalizeScore(

          prediction
            ?.anomaly_score

        );



      /**
       * ============================================
       * HYBRID DETECTION
       * ============================================
       */
      const isAnomaly =

        prediction
          ?.is_anomaly === true ||

        anomalyScore >= 0.7 ||

        cleanData.requests > 800 ||

        cleanData.failedLogins > 10;



      /**
       * ============================================
       * ATTACK TYPE
       * ============================================
       */
      let attackType =
        normalizeAttackType(
          prediction.attackType
        );



      if (
        cleanData.failedLogins > 10
      ) {

        attackType =
          "Brute Force";

      }

      else if (
        cleanData.requests > 800
      ) {

        attackType =
          "DDoS";

      }

      else if (
        isAnomaly &&
        attackType === "Normal"
      ) {

        attackType =
          "Suspicious";

      }



      /**
       * ============================================
       * SEVERITY
       * ============================================
       */
      const severity =
        getSeverity(

          cleanData,

          anomalyScore,

          attackType

        );



      /**
       * ============================================
       * SAVE LOG
       * ============================================
       */
      const log =
        await Log.create({

          ...cleanData,

          user:
            userId,

          is_anomaly:
            isAnomaly,

          anomaly_score:
            anomalyScore,

          attackType

        });



      /**
       * ============================================
       * REALTIME TRAFFIC
       * ============================================
       */
      emitTrafficUpdate(

        io,

        userId,

        {

          requests:
            cleanData.requests,

          isAnomaly,

          ip:
            cleanData.ip,

          attackType

        }

      );



      /**
       * ============================================
       * ALERT
       * ============================================
       */
      let alert = null;


      if (
        isAnomaly
      ) {

        alert =
          await createAlert(

            {

              ip:
                log.ip,

              anomalyScore,

              attackType,

              severity,

              message:
                `${attackType} threat detected`,

              meta: {

                requests:
                  log.requests,

                failedLogins:
                  log.failedLogins

              }

            },

            io,

            userId

          );

      }



      logger.info(
        `Log processed for ${userId}`
      );


      return {

        log,

        mlResult: {

          is_anomaly:
            isAnomaly,

          anomaly_score:
            anomalyScore,

          attackType,

          severity

        },

        alert

      };

    }
    catch (error) {

      logger.error(
        `processLog error: ${error.message}`
      );

      throw error;

    }

  };



/**
 * ============================================
 * GET LOGS
 * ============================================
 */
const getLogs =
  async (
    userId,
    options = {}
  ) => {

    try {

      const limit =
        Math.min(
          Number(
            options.limit
          ) || 100,
          500
        );

      const page =
        Math.max(
          Number(
            options.page
          ) || 1,
          1
        );

      const skip =
        (page - 1)
        *
        limit;


      const query = {

        user: userId

      };


      if (
        options.attackType
      ) {

        query.attackType =
          options.attackType;

      }


      if (
        typeof options
          .is_anomaly !== "undefined"
      ) {

        query.is_anomaly =
          options.is_anomaly;

      }


      const logs =
        await Log.find(
          query
        )
          .sort({

            createdAt: -1

          })
          .skip(skip)
          .limit(limit)
          .lean();


      const total =
        await Log.countDocuments(
          query
        );


      return {

        logs,

        pagination: {

          total,

          page,

          limit,

          pages:
            Math.ceil(
              total / limit
            )

        }

      };

    }
    catch (error) {

      logger.error(
        `getLogs error: ${error.message}`
      );

      throw error;

    }

  };



export default {

  processLog,

  getLogs

};