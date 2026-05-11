import chokidar from "chokidar";
import fs from "fs";

import config from "./config.js";
import logger from "./logger.js";

import { parseNginxLog } from "./parser.js";
import { sendLogs } from "./sender.js";

/**
 * ==================================================
 * BUFFER
 * ==================================================
 */
let logBuffer = [];

/**
 * Prevent duplicate processing
 */
let lastProcessedLine = "";

/**
 * ==================================================
 * STARTUP
 * ==================================================
 */
logger.info(
  "🚀 ThreatOps Collector Started"
);

/**
 * ==================================================
 * VALIDATE LOG FILE
 * ==================================================
 */
if (!fs.existsSync(config.logFilePath)) {
  logger.error(
    `❌ Log file not found: ${config.logFilePath}`
  );

  process.exit(1);
}

logger.info(
  `📂 Watching log file: ${config.logFilePath}`
);

/**
 * ==================================================
 * PRODUCTION WATCHER
 * ==================================================
 *
 * usePolling:
 * Important for Windows stability
 */
const watcher = chokidar.watch(
  config.logFilePath,
  {
    persistent: true,

    ignoreInitial: false,

    usePolling: true,

    interval: 1000,

    awaitWriteFinish: {
      stabilityThreshold: 500,
      pollInterval: 100,
    },
  }
);

/**
 * ==================================================
 * FILE CHANGE EVENT
 * ==================================================
 */
watcher.on("change", (path) => {
  try {
    console.log(
      `🔥 FILE CHANGED: ${path}`
    );

    /**
     * Read latest file content
     */
    const content =
      fs.readFileSync(
        config.logFilePath,
        "utf8"
      );

    /**
     * Split lines
     */
    const lines = content
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (!lines.length) {
      return;
    }

    /**
     * ONLY VALID HTTP LINES
     */
    const validLines = lines.filter(
      (line) =>
        line.includes("HTTP/")
    );

    if (!validLines.length) {
      logger.warn(
        "⚠️ No valid HTTP log lines found"
      );

      return;
    }

    /**
     * LAST COMPLETE LINE
     */
    const lastLine =
      validLines[
      validLines.length - 1
      ];

    /**
     * Prevent duplicate processing
     */
    if (
      lastLine === lastProcessedLine
    ) {
      return;
    }

    lastProcessedLine =
      lastLine;

    /**
     * Parse nginx log
     */
    const parsed =
      parseNginxLog(lastLine);

    console.log(parsed);

    if (!parsed) {
      logger.warn(
        "⚠️ Failed to parse log line"
      );

      return;
    }

    /**
     * Push to batch buffer
     */
    logBuffer.push(parsed);

    logger.info(
      `📡 Log captured from ${parsed.ip}`
    );
  } catch (error) {
    logger.error(
      `❌ Watcher error: ${error.message}`
    );
  }
});

/**
 * ==================================================
 * WATCHER ERRORS
 * ==================================================
 */
watcher.on("error", (error) => {
  logger.error(
    `❌ Chokidar error: ${error.message}`
  );
});

/**
 * ==================================================
 * BATCH SENDER
 * ==================================================
 */
setInterval(async () => {
  try {
    if (!logBuffer.length) {
      return;
    }

    /**
     * Copy batch
     */
    const batch = [...logBuffer];

    /**
     * Clear buffer
     */
    logBuffer = [];

    logger.info(
      `🚀 Sending batch: ${batch.length}`
    );

    /**
     * Send logs
     */
    await sendLogs(batch);

    logger.info(
      `✅ Batch sent successfully (${batch.length} logs)`
    );
  } catch (error) {
    // Error is already logged by sendLogs
  }
}, config.batchInterval);

/**
 * ==================================================
 * GRACEFUL SHUTDOWN
 * ==================================================
 */
process.on("SIGINT", async () => {
  logger.info(
    "🛑 Collector shutting down..."
  );

  await watcher.close();

  process.exit(0);
});