import axios from "axios";

import os from "os";

import config, {
  generateDeviceId,
} from "./config.js";

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
     * DEVICE AUTHENTICATION
     * ==========================================
     */
    "x-api-key": config.apiKey || "",

    "x-device-id":
      config.deviceId || "",

    "x-device-key":
      config.deviceKey || "",

    /**
     * ==========================================
     * AGENT META
     * ==========================================
     */
    "x-agent-version":
      config.agentVersion || "1.0.0",

    "x-agent-platform":
      config.platform || os.platform(),
  },
});

/**
 * ==================================================
 * REGISTER DEVICE
 * ==================================================
 */
export const registerDevice =
  async (token) => {
    try {
      const deviceId =
        generateDeviceId();

      const response =
        await api.post(
          "/api/devices/register",

          {
            deviceId,

            hostname:
              os.hostname(),

            os:
              os.platform(),

            architecture:
              os.arch(),

            agentVersion:
              config.agentVersion,
          },

          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      logger.info(
        `✅ Device registered: ${deviceId}`
      );

      return response.data;
    } catch (error) {
      const errorMsg =
        error.response?.data
          ?.message ||
        error.message;

      logger.error(
        `❌ Device registration failed: ${errorMsg}`
      );

      if (
        error.response?.data
      ) {
        console.dir(
          error.response.data,
          {
            depth: null,
          }
        );
      }

      throw new Error(
        errorMsg
      );
    }
  };

/**
 * ==================================================
 * SEND LOGS
 * ==================================================
 */
export const sendLogs =
  async (logs) => {
    try {
      // ================= VALIDATION =================
      if (
        !logs ||
        !Array.isArray(logs) ||
        !logs.length
      ) {
        return;
      }

      /**
       * ================= CLEAN PAYLOAD =================
       */
      const payload = {
        // ✅ Device metadata
        device: {
          deviceId:
            config.deviceId,

          hostname:
            config.hostname,

          platform:
            config.platform,

          architecture:
            config.architecture,

          agentVersion:
            config.agentVersion,
        },

        // ✅ Logs
        logs: logs.map(
          (log) => ({
            ip: log.ip,

            requests:
              Number(
                log.requests
              ) || 1,

            endpoint:
              log.endpoint ||
              "/",

            method:
              log.method ||
              "GET",

            user_agent:
              log.user_agent ||
              "Unknown",

            timestamp:
              log.timestamp,

            statusCode:
              log.statusCode ||
              200,

            bytes:
              log.bytes || 0,
          })
        ),
      };

      // ================= DEBUG =================
      if (
        config.environment !==
        "production"
      ) {
        console.log(
          "📦 PAYLOAD:"
        );

        console.dir(
          payload,
          {
            depth: null,
          }
        );
      }

      /**
       * ================= SEND TO BACKEND =================
       */
      const response =
        await api.post(
          "/api/logs",
          payload
        );

      logger.info(
        `✅ Sent ${logs.length} logs`
      );

      return response.data;
    } catch (error) {
      const errorMsg =
        error.response?.data
          ?.message ||
        error.message;

      logger.error(
        `❌ Failed to send logs: ${errorMsg}`
      );

      if (
        error.response?.data
      ) {
        console.dir(
          error.response.data,
          {
            depth: null,
          }
        );
      }

      // Rethrow
      throw new Error(
        errorMsg
      );
    }
  };

/**
 * ==================================================
 * HEARTBEAT
 * ==================================================
 */
export const sendHeartbeat =
  async () => {
    try {
      await api.post(
        "/api/devices/heartbeat",

        {
          deviceId:
            config.deviceId,

          hostname:
            config.hostname,

          platform:
            config.platform,

          timestamp:
            new Date().toISOString(),
        }
      );

      logger.info(
        "💓 Heartbeat sent"
      );
    } catch (error) {
      logger.error(
        `❌ Heartbeat failed: ${error.response?.data
          ?.message ||
        error.message
        }`
      );
    }
  };