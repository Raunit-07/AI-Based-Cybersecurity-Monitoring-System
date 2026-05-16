import chokidar from "chokidar";
import fs from "fs";

import config from "./config.js";
import logger from "./logger.js";

import { parseNginxLog } from "./parser.js";

import {
  sendLogs,
  sendHeartbeat,
} from "./sender.js";

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
 * VALIDATE CONFIG
 * ==================================================
 */
if (!config.apiKey) {
  logger.error("❌ MISSING API KEY!");

  console.log(
    "\n=================================================="
  );

  console.log(
    "To run the agent, please provide your API key:"
  );

  console.log(
    "USAGE: node agent.js <YOUR_API_KEY> [OPTIONAL_LOG_PATH]"
  );

  console.log(
    "EXAMPLE: node agent.js e485f7... C:/nginx/logs/access.log"
  );

  console.log(
    "OR: Set LOG_API_KEY in your .env file"
  );

  console.log(
    "==================================================\n"
  );

  process.exit(1);
}

if (!config.backendUrl) {
  logger.error(
    "❌ MISSING BACKEND URL!"
  );

  process.exit(1);
}

if (
  !fs.existsSync(
    config.logFilePath
  )
) {
  logger.error(
    `❌ Log file not found: ${config.logFilePath}`
  );

  console.log(
    "Please ensure the path is correct in your .env file."
  );

  process.exit(1);
}

logger.info(
  `🔑 API Key Loaded: ${config.apiKey.substring(0, 8)}...`
);

logger.info(
  `🌐 Backend URL: ${config.backendUrl}`
);

logger.info(
  `📂 Watching log file: ${config.logFilePath}`
);

/**
 * ==================================================
 * HEARTBEAT LOOP
 * ==================================================
 */
const startHeartbeatLoop =
  () => {
    /**
     * Send immediately
     */
    sendHeartbeat();

    /**
     * Then continue every 30 sec
     */
    setInterval(
      async () => {
        try {
          await sendHeartbeat();
        } catch (error) {
          logger.error(
            `❌ Heartbeat loop error: ${error.message}`
          );
        }
      },

      config.heartbeatInterval ||
      30000
    );

    logger.info(
      "💓 Heartbeat loop started"
    );
  };

/**
 * ==================================================
 * START HEARTBEAT
 * ==================================================
 */
startHeartbeatLoop();

/**
 * ==================================================
 * PRODUCTION WATCHER
 * ==================================================
 *
 * usePolling:
 * Important for Windows stability
 */
const watcher =
  chokidar.watch(
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
watcher.on(
  "change",
  (path) => {
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
        .map((line) =>
          line.trim()
        )
        .filter(Boolean);

      if (!lines.length) {
        return;
      }

      /**
       * ONLY VALID HTTP LINES
       */
      const validLines =
        lines.filter(
          (line) =>
            line.includes(
              "HTTP/"
            )
        );

      if (
        !validLines.length
      ) {
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
        lastLine ===
        lastProcessedLine
      ) {
        return;
      }

      lastProcessedLine =
        lastLine;

      /**
       * Parse nginx log
       */
      const parsed =
        parseNginxLog(
          lastLine
        );

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
      logBuffer.push(
        parsed
      );

      logger.info(
        `📡 Log captured from ${parsed.ip}`
      );
    } catch (error) {
      logger.error(
        `❌ Watcher error: ${error.message}`
      );
    }
  }
);

/**
 * ==================================================
 * WATCHER ERRORS
 * ==================================================
 */
watcher.on(
  "error",
  (error) => {
    logger.error(
      `❌ Chokidar error: ${error.message}`
    );
  }
);

/**
 * ==================================================
 * BATCH SENDER
 * ==================================================
 */
setInterval(
  async () => {
    try {
      if (!logBuffer.length) {
        return;
      }

      /**
       * Copy batch
       */
      const batch = [
        ...logBuffer,
      ];

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
      await sendLogs(
        batch
      );

      logger.info(
        `✅ Batch sent successfully (${batch.length} logs)`
      );
    } catch (error) {
      logger.error(
        `❌ Batch send error: ${error.message}`
      );
    }
  },

  config.batchInterval
);

/**
 * ==================================================
 * GRACEFUL SHUTDOWN
 * ==================================================
 */
process.on(
  "SIGINT",
  async () => {
    logger.info(
      "🛑 Collector shutting down..."
    );

    await watcher.close();

    process.exit(0);
  }
);