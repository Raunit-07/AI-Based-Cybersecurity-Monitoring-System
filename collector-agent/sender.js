import axios from "axios";
import os from "os";

import config, { generateDeviceId } from "./config.js";
import logger from "./logger.js";

/**
 * ==================================================
 * AXIOS CLIENT
 * ==================================================
 */
const api = axios.create({
  baseURL: config.backendUrl,
  timeout: 15000,

  headers: {
    "Content-Type": "application/json",

    /**
     * ==========================================
     * AGENT META
     * ==========================================
     */
    "x-agent-version": config.agentVersion || "1.0.0",
    "x-agent-platform": config.platform || os.platform(),
  },
});

/**
 * ==================================================
 * DYNAMIC HEADER INTERCEPTOR
 * ==================================================
 */
api.interceptors.request.use(
  (reqConfig) => {
    reqConfig.headers["x-device-id"] = config.deviceId || "";
    reqConfig.headers["x-device-key"] = config.deviceKey || "";
    reqConfig.headers["x-api-key"] = config.apiKey || "";
    return reqConfig;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * ==================================================
 * REGISTER DEVICE
 * ==================================================
 */
export const registerDevice = async (token) => {
  try {
    const deviceId = generateDeviceId();

    const payload = {
      deviceId,

      // Added fallback support
      name: config.deviceName || os.hostname(),

      hostname: os.hostname(),

      os: os.platform(),

      architecture: os.arch(),

      agentVersion: config.agentVersion,
    };

    console.log("\n========== REGISTER REQUEST ==========");
    console.log(JSON.stringify(payload, null, 2));
    console.log("=======================================\n");

    const extraHeaders = {};
    if (token) {
      extraHeaders.Authorization = `Bearer ${token}`;
    }

    const response = await api.post("/api/devices/register", payload, {
      headers: extraHeaders,
    });

    console.log("\n========== REGISTER RESPONSE ==========");
    console.log("REGISTER RESPONSE:");
    console.log(JSON.stringify(response.data, null, 2));
    console.log("========================================\n");

    logger.info(`✅ Device registered: ${deviceId}`);

    return response.data;
  } catch (error) {
  console.log("========== REGISTER ERROR ==========");
  console.log("MESSAGE:", error.message);
  console.log("CODE:", error.code);
  console.log("STATUS:", error.response?.status);
  console.log("DATA:", error.response?.data);
  console.log("=====================================");

  const errorMsg =
    error.response?.data?.message ||
    error.message;

  logger.error(`❌ Device registration failed: ${errorMsg}`);

  throw error;
}
};

/**
 * ==================================================
 * SEND LOGS
 * ==================================================
 */
export const sendLogs = async (logs) => {
  try {
    if (!logs || !Array.isArray(logs) || !logs.length) {
      return;
    }

    const payload = {
      device: {
        deviceId: config.deviceId,
        hostname: config.hostname,
        platform: config.platform,
        architecture: config.architecture,
        agentVersion: config.agentVersion,
      },

      logs: logs.map((log) => ({
        ip: log.ip,
        requests: Number(log.requests) || 1,
        endpoint: log.endpoint || "/",
        method: log.method || "GET",
        user_agent: log.user_agent || "Unknown",
        timestamp: log.timestamp,
        statusCode: log.statusCode || 200,
        bytes: log.bytes || 0,
      })),
    };

    if (config.environment !== "production") {
      console.log("📦 LOG PAYLOAD:");
      console.dir(payload, {
        depth: null,
      });
    }

    const response = await api.post("/api/logs", payload);

    logger.info(`✅ Sent ${logs.length} logs`);

    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message;

    logger.error(`❌ Failed to send logs: ${errorMsg}`);

    throw new Error(errorMsg);
  }
};

/**
 * ==================================================
 * HEARTBEAT
 * ==================================================
 */
export const sendHeartbeat = async () => {
  try {
    await api.post("/api/devices/heartbeat", {
      deviceId: config.deviceId,

      hostname: config.hostname,

      platform: config.platform,

      timestamp: new Date().toISOString(),
    });

    logger.info("💓 Heartbeat sent");
  } catch (error) {
    logger.error(
      `❌ Heartbeat failed: ${error.response?.data?.message || error.message}`,
    );
  }
};

/**
 * ==================================================
 * SEND TELEMETRY
 * ==================================================
 */
export const sendTelemetry = async (telemetry) => {
  try {
    console.log("\n========== TELEMETRY ==========");
    console.dir(telemetry, { depth: null });
    console.log("================================\n");

    const response = await api.post("/api/telemetry/ingest", telemetry);

    logger.info("⚡ Telemetry sent");

    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message;

    logger.error(`❌ Failed to send telemetry: ${errorMsg}`);

    throw new Error(errorMsg);
  }
};
