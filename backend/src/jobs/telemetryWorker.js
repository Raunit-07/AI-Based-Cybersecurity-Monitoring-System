import { Worker } from "bullmq";
import { getRedisConnection } from "../config/redis.js";
import { processTelemetry } from "../services/telemetry.service.js";
import logger from "../utils/logger.js";

let workerInstance = null;

export const initTelemetryWorker = (io) => {
  if (workerInstance) return workerInstance;

  workerInstance = new Worker(
    "telemetry-processing",
    async (job) => {
      await processTelemetry(job.data, io);
    },
    {
      connection: getRedisConnection(),
      concurrency: 5,
    }
  );

  workerInstance.on("completed", (job) => {
    logger.debug(`Telemetry job ${job.id} completed`);
  });

  workerInstance.on("failed", (job, err) => {
    logger.error(`Telemetry job ${job?.id} failed: ${err.message}`);
  });

  return workerInstance;
};
