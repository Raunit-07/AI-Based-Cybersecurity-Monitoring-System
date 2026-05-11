import logsService from "../services/logs.service.js";

import catchAsync from "../utils/catchAsync.js";

import apiResponse from "../utils/apiResponse.js";

import logger from "../utils/logger.js";

/**
 * ==================================================
 * CREATE / INGEST LOGS
 * Supports:
 * - single log
 * - batch logs
 * - collector agent
 * - multi-tenant isolation
 * ==================================================
 */
const createLog = catchAsync(
  async (req, res) => {
    try {

      /**
       * ==================================================
       * SOCKET.IO
       * ==================================================
       */
      const io =
        req.io ||
        req.app.get("io");

      /**
       * ==================================================
       * SAFE USER FALLBACK
       * ==================================================
       */
      const userId =
        req.systemUser?._id ||
        req.user?._id ||
        null;

      /**
       * ==================================================
       * SUPPORT:
       * - req.logs
       * - req.body.logs
       * - single object
       * ==================================================
       */
      const logs =
        Array.isArray(req.logs)
          ? req.logs
          : Array.isArray(req.body.logs)
            ? req.body.logs
            : [req.body];

      /**
       * ==================================================
       * EMPTY CHECK
       * ==================================================
       */
      if (
        !logs ||
        !Array.isArray(logs) ||
        !logs.length
      ) {
        return apiResponse(
          res,
          400,
          false,
          null,
          "No logs provided"
        );
      }

      /**
       * DEBUG
       */
      console.log(
        "🔥 FINAL LOGS:",
        JSON.stringify(
          logs,
          null,
          2
        )
      );

      /**
       * ==================================================
       * PROCESS RESULTS
       * ==================================================
       */
      const processedResults = [];

      /**
       * ==================================================
       * PROCESS EACH LOG
       * ==================================================
       */
      for (const logData of logs) {

        try {

          /**
           * BASIC VALIDATION
           */
          if (!logData?.ip) {
            logger.warn(
              "⚠️ Invalid log skipped"
            );

            continue;
          }

          /**
           * ==================================================
           * NORMALIZE LOG
           * ==================================================
           */
          const processedLogData = {

            ip:
              logData.ip,

            endpoint:
              logData.endpoint || "/",

            method:
              logData.method || "GET",

            requests:
              Number(
                logData.requests || 1
              ),

            statusCode:
              Number(
                logData.statusCode || 200
              ),

            bytes:
              Number(
                logData.bytes || 0
              ),

            user_agent:
              logData.user_agent ||
              "Unknown",

            referrer:
              logData.referrer || "-",

            timestamp:
              logData.timestamp ||
              new Date().toISOString(),

            user:
              userId,
          };

          /**
           * DEBUG
           */
          console.log(
            "✅ PROCESSING:",
            processedLogData
          );

          /**
           * ==================================================
           * PROCESS LOG
           * ==================================================
           */
          const result =
            await logsService.processLog(
              processedLogData,
              io,
              userId
            );

          processedResults.push({
            log: result?.log || null,

            ml:
              result?.mlResult ||
              null,

            alert:
              result?.alert ||
              null,
          });

          logger.info(
            `✅ Log processed`
          );

        } catch (error) {

          logger.error(
            `❌ Failed to process log: ${error.message}`
          );
        }
      }

      /**
       * ==================================================
       * RESPONSE
       * ==================================================
       */
      return apiResponse(
        res,
        201,
        true,
        {
          totalReceived:
            logs.length,

          totalProcessed:
            processedResults.length,

          results:
            processedResults,
        },
        "Logs processed successfully"
      );

    } catch (error) {

      logger.error(
        `❌ Controller Error: ${error.message}`
      );

      return apiResponse(
        res,
        500,
        false,
        null,
        error.message
      );
    }
  }
);

/**
 * ==================================================
 * GET LOGS
 * Multi-tenant safe
 * ==================================================
 */
const getLogs = catchAsync(
  async (req, res) => {
    /**
     * ==================================================
     * AUTH VALIDATION
     * ==================================================
     */
    if (!req.user?._id) {
      return apiResponse(
        res,
        401,
        false,
        null,
        "Unauthorized"
      );
    }

    let logs = [];

    try {
      /**
       * ==================================================
       * FETCH USER LOGS ONLY
       * ==================================================
       */
      if (
        typeof logsService.getLogs ===
        "function"
      ) {
        logs =
          await logsService.getLogs(
            req.user._id,
            req.query
          );
      } else {
        logger.warn(
          "⚠️ logsService.getLogs is not defined"
        );

        logs = {
          logs: [],

          pagination: {
            total: 0,
            page: 1,
            limit: 0,
            pages: 0,
          },
        };
      }
    } catch (error) {
      logger.error(
        `❌ Fetch logs error: ${error.message}`
      );

      logs = {
        logs: [],

        pagination: {
          total: 0,
          page: 1,
          limit: 0,
          pages: 0,
        },
      };
    }

    /**
     * ==================================================
     * RESPONSE
     * ==================================================
     */
    return apiResponse(
      res,
      200,
      true,
      logs,
      "Logs fetched successfully"
    );
  }
);

/**
 * ==================================================
 * EXPORTS
 * ==================================================
 */
export {
  createLog,
  getLogs,
};