import crypto from "crypto";
import dotenv from "dotenv";
import fs from "fs";
import os from "os";
import path from "path";
dotenv.config();


export const generateDeviceId =
  () => {
    const raw =
      `${os.hostname()}-${os.platform()}-${os.arch()  }`;

    return crypto
      .createHash("sha256")
      .update(raw)
      .digest("hex");
  };


export const saveCredentialsToEnv = (deviceId, deviceKey) => {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, `DEVICE_ID=${deviceId}\nDEVICE_KEY=${deviceKey}\n`, "utf8");
    return;
  }
  let content = fs.readFileSync(envPath, "utf8");

  if (content.includes("DEVICE_ID=")) {
    content = content.replace(/DEVICE_ID=.*/, `DEVICE_ID=${deviceId}`);
  } else {
    content += `\nDEVICE_ID=${deviceId}`;
  }

  if (content.includes("DEVICE_KEY=")) {
    content = content.replace(/DEVICE_KEY=.*/, `DEVICE_KEY=${deviceKey}`);
  } else {
    content += `\nDEVICE_KEY=${deviceKey}`;
  }

  fs.writeFileSync(envPath, content, "utf8");
};

const apiKey =
  process.argv[2] ||
  process.env.LOG_API_KEY;

const logFilePath =
  process.argv[3] ||
  process.env.LOG_FILE_PATH;

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

  deviceKey:
    process.env.DEVICE_KEY ||
    process.env.DEVICE_SECRET ||
    "",

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