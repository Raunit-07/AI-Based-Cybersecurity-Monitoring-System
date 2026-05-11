import axios from "axios";

import config from "./config.js";
import logger from "./logger.js";

const api = axios.create({
  baseURL: config.backendUrl,

  timeout: 10000,

  headers: {
    "Content-Type":
      "application/json",

    "x-api-key":
      config.apiKey,
  },
});

/**
 * ==================================================
 * SEND LOGS
 * ==================================================
 */
export const sendLogs = async (
  logs
) => {
  try {
    if (
      !logs ||
      !Array.isArray(logs) ||
      !logs.length
    ) {
      return;
    }

    /**
     * Clean payload
     */
    const payload = {
      logs: logs.map((log) => ({
        ip: log.ip,

        requests:
          Number(log.requests) || 1,

        endpoint:
          log.endpoint || "/",

        method:
          log.method || "GET",

        user_agent:
          log.user_agent ||
          "Unknown",

        timestamp:
          log.timestamp,

        statusCode:
          log.statusCode || 200,

        bytes:
          log.bytes || 0,
      })),
    };

    console.log(
      "📦 PAYLOAD:"
    );

    console.dir(payload, {
      depth: null,
    });

    /**
     * Send to backend
     */
    const response =
      await api.post(
        "/api/logs",
        payload
      );

    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message;
    
    logger.error(`❌ Failed to send logs: ${errorMsg}`);
    
    if (error.response?.data) {
      console.dir(error.response.data, { depth: null });
    }

    // Rethrow to let the caller know it failed
    throw new Error(errorMsg);
  }
};