import fs from "fs";
import chokidar from "chokidar";
import axios from "axios";
import path from "path";

import { createAlert } from "./alerts.service.js";

let lastSize = 0;

/**
 * =====================================
 * START LOG WATCHER
 * =====================================
 */
export const startLogWatcher = (io) => {
    const logPath = path.resolve(
        "logs/access.log"
    );

    console.log(
        "📡 Watching logs:",
        logPath
    );

    // ================= FILE EXISTS CHECK =================
    if (!fs.existsSync(logPath)) {
        console.error(
            "❌ Log file does not exist:",
            logPath
        );

        return;
    }

    chokidar
        .watch(logPath, {
            persistent: true,

            usePolling: true,

            interval: 1000,

            ignoreInitial: false,
        })
        .on("change", async () => {
            try {
                const stats =
                    fs.statSync(logPath);

                // ================= FILE TRUNCATION SAFETY =================
                if (
                    stats.size < lastSize
                ) {
                    lastSize = 0;
                }

                // ================= NO NEW DATA =================
                if (
                    stats.size === lastSize
                ) {
                    return;
                }

                const stream =
                    fs.createReadStream(
                        logPath,
                        {
                            start: lastSize,
                            end: stats.size,
                        }
                    );

                let newData = "";

                stream.on(
                    "data",
                    (chunk) => {
                        newData +=
                            chunk.toString();
                    }
                );

                stream.on(
                    "end",
                    async () => {
                        lastSize =
                            stats.size;

                        const lines =
                            newData
                                .split("\n")
                                .filter(Boolean);

                        for (const line of lines) {
                            try {
                                // ================= SEND TO ML =================
                                const response =
                                    await axios.post(
                                        "http://localhost:8000/predict",
                                        {
                                            log: line,
                                        },
                                        {
                                            timeout: 5000,
                                        }
                                    );

                                const result =
                                    response.data;

                                const ip =
                                    extractIP(line);

                                /**
                                 * ⚠️ IMPORTANT
                                 * Global watcher currently has
                                 * no user ownership.
                                 *
                                 * Temporary fallback:
                                 * user = null
                                 *
                                 * Future:
                                 * attach user from ingestion pipeline
                                 */
                                const alert =
                                    await createAlert(
                                        {
                                            user: null,

                                            ip,

                                            rawLog:
                                                line,

                                            attackType:
                                                result.attackType ||
                                                "Unknown",

                                            anomalyScore:
                                                result.anomaly_score ||
                                                0,

                                            severity:
                                                result.is_anomaly
                                                    ? "high"
                                                    : "low",

                                            timestamp:
                                                new Date(),
                                        },
                                        io
                                    );

                                // ================= SAFE SOCKET EMIT =================
                                /**
                                 * ONLY emit globally
                                 * if alert has no user.
                                 *
                                 * Future SaaS:
                                 * io.to(userId).emit(...)
                                 */
                                if (!alert?.user) {
                                    io.emit(
                                        "traffic_update",
                                        {
                                            requests: 1,

                                            blocked:
                                                result.is_anomaly
                                                    ? 1
                                                    : 0,

                                            timestamp:
                                                new Date(),

                                            ip,

                                            attackType:
                                                result.attackType ||
                                                "Unknown",

                                            user: null,
                                        }
                                    );
                                }

                                console.log(
                                    "🚨 Alert processed"
                                );
                            } catch (error) {
                                console.error(
                                    "❌ ML Processing Error:",
                                    error.message
                                );
                            }
                        }
                    }
                );

                stream.on(
                    "error",
                    (err) => {
                        console.error(
                            "❌ Stream Error:",
                            err.message
                        );
                    }
                );
            } catch (err) {
                console.error(
                    "❌ Log watcher error:",
                    err.message
                );
            }
        });

    console.log(
        "✅ Log watcher initialized"
    );
};

/**
 * =====================================
 * EXTRACT IP
 * =====================================
 */
const extractIP = (line) => {
    const match = line.match(
        /\b(?:\d{1,3}\.){3}\d{1,3}\b/
    );

    return match
        ? match[0]
        : "Unknown";
};