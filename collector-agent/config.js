import dotenv from "dotenv";

import os from "os";

import crypto from "crypto";

// ================= LOAD ENV =================
dotenv.config();

/**
 * ==================================================
 * DEVICE ID GENERATION
 * ==================================================
 * Creates stable unique device fingerprint
 */
export const generateDeviceId =
  () => {
    const raw =
      `${os.hostname()}-${os.platform()}-${os.arch()  }`;

    return crypto
      .createHash("sha256")
      .update(raw)
      .digest("hex");
  };

/**
 * ==================================================
 * PRIORITY:
 * 1. CLI ARGUMENT
 * 2. ENV VARIABLE
 * ==================================================
 */
const apiKey =
  process.argv[2] ||
  process.env.LOG_API_KEY;

const logFilePath =
  process.argv[3] ||
  process.env.LOG_FILE_PATH;

/**
 * ==================================================
 * CONFIG OBJECT
 * ==================================================
 */
const config = {
  // ================= BACKEND =================
  backendUrl:
    process.env.BACKEND_URL ||
    "https://threatops-backend.onrender.com",

  // ================= API AUTH =================
  apiKey:
    apiKey?.trim() || "",

  // ================= DEVICE =================
  deviceId:
    process.env.DEVICE_ID ||
    generateDeviceId(),

  hostname:
    os.hostname(),

  platform:
    os.platform(),

  architecture:
    os.arch(),

  // ================= LOG FILE =================
  logFilePath:
    logFilePath?.trim() ||
    "./logs/access.log",

  // ================= AGENT =================
  agentVersion:
    process.env.AGENT_VERSION ||
    "1.0.0",

  batchInterval:
    Number(
      process.env.BATCH_INTERVAL
    ) || 3000,

  heartbeatInterval:
    Number(
      process.env.HEARTBEAT_INTERVAL
    ) || 30000,

  // ================= ENV =================
  environment:
    process.env.NODE_ENV ||
    "development",
};

// ================= VALIDATION =================
if (!config.apiKey) {
  console.warn(
    "⚠️ LOG_API_KEY missing"
  );
}

export default config;