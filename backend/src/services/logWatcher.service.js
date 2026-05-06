import fs from "fs";
import chokidar from "chokidar";
import axios from "axios";
import path from "path";
import { createAlert } from "./alerts.service.js";

let lastSize = 0;

export const startLogWatcher = (io) => {
    const logPath = path.resolve("logs/access.log");

    console.log("📡 Watching logs:", logPath);

    chokidar.watch(logPath, {
        persistent: true,
        usePolling: true,
        interval: 1000,
    }).on("change", async () => {
        console.log("🔥 FILE CHANGE DETECTED");

        const stats = fs.statSync(logPath);

        console.log("📦 File size:", stats.size);

        const stream = fs.createReadStream(logPath, {
            start: lastSize,
            end: stats.size,
        });

        let newData = "";

        stream.on("data", (chunk) => {
            newData += chunk.toString();
        });

        stream.on("end", async () => {
            lastSize = stats.size;

            console.log("📝 New log data:", newData);

            const lines = newData.split("\n").filter(Boolean);

            for (const line of lines) {
                try {
                    console.log("🚀 Sending to ML:", line);

                    const response = await axios.post(
                        "http://localhost:8000/predict",
                        {
                            log: line,
                        }
                    );

                    console.log("✅ ML RESPONSE:", response.data);

                    const result = response.data;

                    // Use standardized createAlert service
                    await createAlert({
                        ip: extractIP(line),
                        rawLog: line,
                        attackType: result.attackType,
                        anomalyScore: result.anomaly_score,
                        severity: result.is_anomaly ? "high" : "low",
                        timestamp: new Date(),
                    }, io);

                    io.emit("traffic-update", {
                        requests: 1,
                        blocked: result.is_anomaly ? 1 : 0,
                        timestamp: new Date(),
                    });

                    console.log("🚨 Real alert emitted via service");
                } catch (error) {
                    console.error("❌ ML Error:", error.message);
                }
            }
        });
    });
};

const extractIP = (line) => {
    const match = line.match(
        /\b(?:\d{1,3}\.){3}\d{1,3}\b/
    );

    return match ? match[0] : "Unknown";
};